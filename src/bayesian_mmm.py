"""
Bayesian Media Mix Model (MMM)

Implements a Bayesian hierarchical model for media mix modeling using PyMC.
The model combines adstock transformation, saturation curves, and control variables
to estimate media effectiveness and ROI with uncertainty quantification.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
import pymc as pm
import arviz as az
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

from .adstock import GeometricAdstock, ChannelSpecificAdstock
from .saturation import HillSaturation, ChannelSaturation


class BayesianMMM:
    """
    Bayesian Media Mix Model with adstock and saturation.
    
    Model structure:
    y ~ Normal(mu, sigma)
    mu = intercept + trend + seasonality + sum(channels)
    
    Each channel:
    channel_effect = beta * saturation(adstock(spend, decay))
    
    Priors:
    - decay ~ Beta(2, 2)  # Adstock decay rates
    - beta ~ HalfNormal(0, 1)  # Channel effectiveness
    - alpha_sat ~ HalfNormal(1, 1)  # Saturation ceiling
    - beta_sat ~ Gamma(2, 1)  # Saturation steepness
    - K_sat ~ HalfNormal(0, median_spend)  # Half-saturation point
    """
    
    def __init__(
        self,
        channel_names: List[str],
        use_adstock: bool = True,
        use_saturation: bool = True,
        use_trend: bool = True,
        use_seasonality: bool = True,
        seasonality_period: int = 52,  # Weekly data = 52 periods/year
        adstock_max_lag: int = 8,
        sampler_config: Optional[Dict] = None
    ):
        """
        Initialize Bayesian MMM.
        
        Parameters:
        -----------
        channel_names : List[str]
            Names of media channels (e.g., ['TV', 'Radio', 'Digital'])
        use_adstock : bool
            Whether to apply adstock transformation
        use_saturation : bool
            Whether to apply saturation curves
        use_trend : bool
            Include linear trend component
        use_seasonality : bool
            Include Fourier seasonality
        seasonality_period : int
            Number of periods in a seasonal cycle
        adstock_max_lag : int
            Maximum lag for adstock computation
        sampler_config : dict
            PyMC sampler configuration
        """
        self.channel_names = channel_names
        self.n_channels = len(channel_names)
        self.use_adstock = use_adstock
        self.use_saturation = use_saturation
        self.use_trend = use_trend
        self.use_seasonality = use_seasonality
        self.seasonality_period = seasonality_period
        self.adstock_max_lag = adstock_max_lag
        
        # Sampler configuration
        self.sampler_config = sampler_config or {
            'draws': 1000,
            'tune': 1000,
            'chains': 4,
            'cores': 4,
            'target_accept': 0.95
        }
        
        # Model state
        self.model = None
        self.trace = None
        self.scaler_X = StandardScaler()
        self.scaler_y = StandardScaler()
        self.is_fitted = False
        
        # Fitted parameters storage
        self.fitted_params = {}
        
    def _preprocess_data(
        self, 
        df: pd.DataFrame,
        target_col: str,
        date_col: Optional[str] = None,
        control_cols: Optional[List[str]] = None
    ) -> Tuple[np.ndarray, np.ndarray, Optional[np.ndarray], pd.DataFrame]:
        """
        Preprocess data for modeling.
        
        Returns:
        --------
        X : np.ndarray (n_obs, n_channels)
            Media spend matrix
        y : np.ndarray (n_obs,)
            Target variable
        controls : np.ndarray or None
            Control variables
        df_processed : pd.DataFrame
            Processed dataframe with features
        """
        df_processed = df.copy()
        
        # Extract target
        y = df_processed[target_col].values
        
        # Extract media channels
        X = df_processed[self.channel_names].values
        
        # Extract controls
        controls = None
        if control_cols:
            controls = df_processed[control_cols].values
        
        return X, y, controls, df_processed
    
    def build_model(
        self,
        X: np.ndarray,
        y: np.ndarray,
        controls: Optional[np.ndarray] = None
    ) -> pm.Model:
        """
        Build PyMC model.
        
        Parameters:
        -----------
        X : np.ndarray
            Media spend matrix (n_obs, n_channels)
        y : np.ndarray
            Target values (n_obs,)
        controls : np.ndarray, optional
            Control variables (n_obs, n_controls)
            
        Returns:
        --------
        model : pm.Model
            PyMC model object
        """
        n_obs, n_channels = X.shape
        
        with pm.Model() as model:
            # Global parameters
            intercept = pm.Normal('intercept', mu=0, sigma=1)
            sigma = pm.HalfNormal('sigma', sigma=1)
            
            # Trend component
            if self.use_trend:
                trend_coef = pm.Normal('trend_coef', mu=0, sigma=0.1)
                trend = trend_coef * np.arange(n_obs)
            else:
                trend = 0
            
            # Seasonality component (Fourier series)
            if self.use_seasonality:
                n_harmonics = 2
                seasonality = 0
                for i in range(n_harmonics):
                    alpha_cos = pm.Normal(f'seasonality_cos_{i}', mu=0, sigma=0.5)
                    alpha_sin = pm.Normal(f'seasonality_sin_{i}', mu=0, sigma=0.5)
                    seasonality += (
                        alpha_cos * np.cos(2 * np.pi * (i + 1) * np.arange(n_obs) / self.seasonality_period) +
                        alpha_sin * np.sin(2 * np.pi * (i + 1) * np.arange(n_obs) / self.seasonality_period)
                    )
            else:
                seasonality = 0
            
            # Control variables
            control_effects = 0
            if controls is not None:
                n_controls = controls.shape[1]
                beta_control = pm.Normal('beta_control', mu=0, sigma=1, shape=n_controls)
                control_effects = pm.math.dot(controls, beta_control)
            
            # Media channels
            media_effects = 0
            
            for i, channel in enumerate(self.channel_names):
                # Channel effectiveness coefficient
                beta_channel = pm.HalfNormal(f'beta_{channel}', sigma=1)
                
                if self.use_adstock:
                    # Adstock decay parameter
                    decay = pm.Beta(f'decay_{channel}', alpha=2, beta=2)
                    
                    # Apply adstock transformation using geometric decay
                    # For computational efficiency in PyMC, we use a recursive approximation
                    spend = X[:, i]
                    adstock_spend = spend[0]
                    adstock_series = [adstock_spend]
                    
                    for t in range(1, n_obs):
                        adstock_spend = spend[t] + decay * adstock_spend
                        adstock_series.append(adstock_spend)
                    
                    spend_transformed = pm.math.stack(adstock_series)
                else:
                    spend_transformed = X[:, i]
                
                if self.use_saturation:
                    # Saturation parameters
                    # Simplified saturation: using logistic for stability in PyMC
                    alpha_sat = pm.HalfNormal(f'alpha_sat_{channel}', sigma=pm.math.mean(spend_transformed))
                    
                    # Hill saturation approximation using softplus
                    # response = alpha_sat * spend / (spend + K_sat)
                    K_sat = pm.HalfNormal(f'K_sat_{channel}', sigma=pm.math.mean(spend_transformed))
                    
                    saturated_response = alpha_sat * spend_transformed / (spend_transformed + K_sat)
                else:
                    saturated_response = spend_transformed
                
                # Channel contribution
                media_effects += beta_channel * saturated_response
            
            # Expected value
            mu = intercept + trend + seasonality + control_effects + media_effects
            
            # Likelihood
            y_obs = pm.Normal('y_obs', mu=mu, sigma=sigma, observed=y)
            
        return model
    
    def fit(
        self,
        df: pd.DataFrame,
        target_col: str,
        date_col: Optional[str] = None,
        control_cols: Optional[List[str]] = None,
        progressbar: bool = True
    ) -> 'BayesianMMM':
        """
        Fit the Bayesian MMM.
        
        Parameters:
        -----------
        df : pd.DataFrame
            Training data
        target_col : str
            Name of target column
        date_col : str, optional
            Name of date column
        control_cols : List[str], optional
            Names of control variable columns
        progressbar : bool
            Show progress bar during sampling
            
        Returns:
        --------
        self : BayesianMMM
            Fitted model
        """
        # Preprocess
        X, y, controls, df_processed = self._preprocess_data(
            df, target_col, date_col, control_cols
        )
        
        # Scale data
        X_scaled = self.scaler_X.fit_transform(X)
        y_scaled = self.scaler_y.fit_transform(y.reshape(-1, 1)).flatten()
        
        if controls is not None:
            controls_scaled = self.scaler_X.fit_transform(controls)
        else:
            controls_scaled = None
        
        # Build model
        self.model = self.build_model(X_scaled, y_scaled, controls_scaled)
        
        # Sample
        with self.model:
            self.trace = pm.sample(
                draws=self.sampler_config['draws'],
                tune=self.sampler_config['tune'],
                chains=self.sampler_config['chains'],
                cores=self.sampler_config['cores'],
                target_accept=self.sampler_config['target_accept'],
                progressbar=progressbar
            )
        
        # Extract fitted parameters
        self._extract_fitted_params()
        
        self.is_fitted = True
        return self
    
    def _extract_fitted_params(self):
        """Extract and store posterior means as fitted parameters."""
        summary = az.summary(self.trace)
        
        self.fitted_params = {
            'intercept': summary.loc['intercept', 'mean'],
            'sigma': summary.loc['sigma', 'mean'],
            'channels': {}
        }
        
        for channel in self.channel_names:
            channel_params = {}
            
            if f'beta_{channel}' in summary.index:
                channel_params['beta'] = summary.loc[f'beta_{channel}', 'mean']
            
            if self.use_adstock and f'decay_{channel}' in summary.index:
                channel_params['decay'] = summary.loc[f'decay_{channel}', 'mean']
            
            if self.use_saturation:
                if f'alpha_sat_{channel}' in summary.index:
                    channel_params['alpha_sat'] = summary.loc[f'alpha_sat_{channel}', 'mean']
                if f'K_sat_{channel}' in summary.index:
                    channel_params['K_sat'] = summary.loc[f'K_sat_{channel}', 'mean']
            
            self.fitted_params['channels'][channel] = channel_params
    
    def predict(
        self,
        df: pd.DataFrame,
        return_components: bool = False
    ) -> Dict[str, np.ndarray]:
        """
        Generate predictions from fitted model.
        
        Parameters:
        -----------
        df : pd.DataFrame
            Data to predict on
        return_components : bool
            Return individual component contributions
            
        Returns:
        --------
        predictions : dict
            Contains 'mean', 'lower', 'upper', and optionally component breakdowns
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        
        # Extract features
        X = df[self.channel_names].values
        n_obs = len(df)
        
        # Scale
        X_scaled = self.scaler_X.transform(X)
        
        # Generate posterior predictive
        with self.model:
            pm.set_data({'X': X_scaled})
            ppc = pm.sample_posterior_predictive(
                self.trace,
                var_names=['y_obs'],
                predictions=True
            )
        
        # Extract predictions
        y_pred_scaled = ppc['predictions']['y_obs']
        
        # Inverse transform
        y_pred = self.scaler_y.inverse_transform(y_pred_scaled.mean(axis=0).reshape(-1, 1)).flatten()
        y_pred_lower = self.scaler_y.inverse_transform(
            np.percentile(y_pred_scaled, 2.5, axis=0).reshape(-1, 1)
        ).flatten()
        y_pred_upper = self.scaler_y.inverse_transform(
            np.percentile(y_pred_scaled, 97.5, axis=0).reshape(-1, 1)
        ).flatten()
        
        result = {
            'mean': y_pred,
            'lower': y_pred_lower,
            'upper': y_pred_upper
        }
        
        if return_components:
            result['components'] = self._compute_components(X)
        
        return result
    
    def _compute_components(self, X: np.ndarray) -> Dict[str, np.ndarray]:
        """Compute individual channel contributions."""
        components = {}
        
        # Apply fitted transformations
        for i, channel in enumerate(self.channel_names):
            params = self.fitted_params['channels'][channel]
            
            spend = X[:, i]
            
            # Adstock
            if self.use_adstock and 'decay' in params:
                adstock = GeometricAdstock(decay=params['decay'])
                spend = adstock.transform(spend)
            
            # Saturation
            if self.use_saturation and 'alpha_sat' in params and 'K_sat' in params:
                # Simplified saturation
                spend = params['alpha_sat'] * spend / (spend + params['K_sat'])
            
            # Scale and multiply by beta
            spend_scaled = (spend - self.scaler_X.mean_[i]) / self.scaler_X.scale_[i]
            contribution = params.get('beta', 1.0) * spend_scaled
            
            # Inverse transform to original scale
            components[channel] = contribution * self.scaler_y.scale_[0]
        
        return components
    
    def compute_roi(
        self,
        df: pd.DataFrame,
        channel_spend: Optional[Dict[str, float]] = None
    ) -> Dict[str, Dict[str, float]]:
        """
        Compute Return on Investment (ROI) for each channel.
        
        Parameters:
        -----------
        df : pd.DataFrame
            Historical data
        channel_spend : dict, optional
            Custom spend levels for ROI calculation
            
        Returns:
        --------
        roi : dict
            ROI statistics for each channel
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before computing ROI")
        
        roi_results = {}
        
        for channel in self.channel_names:
            # Get historical spend for this channel
            if channel_spend and channel in channel_spend:
                total_spend = channel_spend[channel]
            else:
                total_spend = df[channel].sum()
            
            # Compute contribution from this channel
            X = df[self.channel_names].values
            components = self._compute_components(X)
            total_contribution = components[channel].sum()
            
            # ROI calculation
            roi = (total_contribution - total_spend) / total_spend if total_spend > 0 else 0
            
            # Get uncertainty from trace
            beta_samples = self.trace.posterior[f'beta_{channel}'].values.flatten()
            roi_samples = []
            
            for beta in beta_samples[:100]:  # Sample 100 draws
                contribution_sample = beta * total_contribution / self.fitted_params['channels'][channel]['beta']
                roi_sample = (contribution_sample - total_spend) / total_spend if total_spend > 0 else 0
                roi_samples.append(roi_sample)
            
            roi_results[channel] = {
                'roi_mean': roi,
                'roi_median': np.median(roi_samples),
                'roi_lower': np.percentile(roi_samples, 2.5),
                'roi_upper': np.percentile(roi_samples, 97.5),
                'total_spend': total_spend,
                'total_contribution': total_contribution
            }
        
        return roi_results
    
    def get_diagnostics(self) -> Dict[str, Any]:
        """
        Get model diagnostics.
        
        Returns:
        --------
        diagnostics : dict
            Model convergence statistics
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted first")
        
        # Compute convergence statistics
        summary = az.summary(self.trace)
        
        diagnostics = {
            'r_hat_max': summary['r_hat'].max(),
            'r_hat_min': summary['r_hat'].min(),
            'ess_min': summary['ess_bulk'].min(),
            'divergences': self.trace.sample_stats.diverging.sum().values,
            'n_samples': self.trace.posterior.sizes['draw'] * self.trace.posterior.sizes['chain']
        }
        
        # Check convergence
        diagnostics['converged'] = (
            diagnostics['r_hat_max'] < 1.1 and
            diagnostics['divergences'] < 10
        )
        
        return diagnostics


# Example usage
if __name__ == "__main__":
    print("BayesianMMM module loaded successfully")
    print("Use: model = BayesianMMM(['TV', 'Radio', 'Digital'])")
