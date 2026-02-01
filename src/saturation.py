"""
Saturation Curves Module

Implements Hill function and other saturation models for capturing
diminishing returns in media effectiveness.
"""

import numpy as np
from typing import Union, Optional
from scipy.optimize import curve_fit


class HillSaturation:
    """
    Hill function saturation curve.
    
    Models the diminishing returns of media spend where effectiveness
decreases as spend increases, approaching a saturation point.
    
    The Hill function has the form:
    response = alpha * spend^beta / (K^beta + spend^beta)
    
    Where:
    - alpha: Maximum response (saturation ceiling)
    - beta: Hill coefficient (shape parameter, controls steepness)
    - K: Half-saturation constant (spend at 50% of max response)
    """
    
    def __init__(self, alpha: float = 1.0, beta: float = 2.0, K: float = 1.0):
        """
        Initialize Hill saturation curve.
        
        Parameters:
        -----------
        alpha : float
            Maximum response level (saturation point)
        beta : float
            Hill coefficient (steepness, typically 1-3)
        K : float
            Half-saturation constant (EC50)
        """
        self.alpha = alpha
        self.beta = beta
        self.K = K
        
    def transform(self, spend: np.ndarray) -> np.ndarray:
        """
        Apply Hill saturation transformation.
        
        Parameters:
        -----------
        spend : np.ndarray
            Media spend (can be adstock-transformed)
            
        Returns:
        --------
        response : np.ndarray
            Saturated response contribution
        """
        spend = np.asarray(spend, dtype=float)
        
        # Handle zero spend
        spend_safe = np.where(spend <= 0, 1e-10, spend)
        
        # Hill function: alpha * x^beta / (K^beta + x^beta)
        numerator = self.alpha * (spend_safe ** self.beta)
        denominator = (self.K ** self.beta) + (spend_safe ** self.beta)
        
        response = numerator / denominator
        
        # Zero spend = zero response
        response = np.where(spend <= 0, 0.0, response)
        
        return response
    
    def marginal_response(self, spend: np.ndarray) -> np.ndarray:
        """
        Calculate marginal response (derivative) at each spend level.
        
        Useful for optimization - shows where additional spend has
        highest impact.
        
        Parameters:
        -----------
        spend : np.ndarray
            Media spend levels
            
        Returns:
        --------
        marginal : np.ndarray
            Marginal response at each spend level
        """
        spend = np.asarray(spend, dtype=float)
        spend_safe = np.where(spend <= 0, 1e-10, spend)
        
        # Derivative of Hill function
        # d/dx [alpha * x^beta / (K^beta + x^beta)] =
        # alpha * beta * x^(beta-1) * K^beta / (K^beta + x^beta)^2
        
        K_beta = self.K ** self.beta
        x_beta = spend_safe ** self.beta
        x_beta_minus_1 = spend_safe ** max(0, self.beta - 1)
        
        numerator = self.alpha * self.beta * x_beta_minus_1 * K_beta
        denominator = (K_beta + x_beta) ** 2
        
        marginal = numerator / denominator
        
        return marginal
    
    def get_saturation_point(self, threshold: float = 0.95) -> float:
        """
        Calculate spend level at which saturation threshold is reached.
        
        Parameters:
        -----------
        threshold : float
            Saturation threshold (default 95% of max)
            
        Returns:
        --------
        spend_level : float
            Spend required to reach threshold
        """
        # Solve: alpha * x^beta / (K^beta + x^beta) = threshold * alpha
        # x^beta / (K^beta + x^beta) = threshold
        # x^beta = threshold * (K^beta + x^beta)
        # x^beta * (1 - threshold) = threshold * K^beta
        # x = [threshold / (1 - threshold)]^(1/beta) * K
        
        if threshold >= 1.0 or threshold <= 0:
            raise ValueError("Threshold must be between 0 and 1")
        
        ratio = threshold / (1 - threshold)
        saturation_spend = (ratio ** (1 / self.beta)) * self.K
        
        return saturation_spend
    
    def fit(self, spend: np.ndarray, response: np.ndarray, 
            alpha_fixed: Optional[float] = None) -> 'HillSaturation':
        """
        Fit Hill parameters to data using nonlinear least squares.
        
        Parameters:
        -----------
        spend : np.ndarray
            Media spend data
        response : np.ndarray
            Observed response data
        alpha_fixed : float, optional
            If provided, fix alpha and only fit beta and K
            
        Returns:
        --------
        self : HillSaturation
            Returns fitted instance
        """
        spend = np.asarray(spend)
        response = np.asarray(response)
        
        # Filter out zero/negative values for fitting
        valid_mask = (spend > 0) & (response >= 0)
        spend_valid = spend[valid_mask]
        response_valid = response[valid_mask]
        
        if len(spend_valid) < 3:
            raise ValueError("Need at least 3 valid data points to fit")
        
        def hill_func(x, alpha, beta, K):
            return alpha * (x ** beta) / (K ** beta + x ** beta)
        
        try:
            if alpha_fixed is not None:
                # Fix alpha, fit only beta and K
                def hill_fixed_alpha(x, beta, K):
                    return alpha_fixed * (x ** beta) / (K ** beta + x ** beta)
                
                popt, _ = curve_fit(hill_fixed_alpha, spend_valid, response_valid,
                                   p0=[2.0, np.median(spend_valid)],
                                   bounds=([0.5, 1e-6], [5.0, spend_valid.max() * 10]))
                self.alpha = alpha_fixed
                self.beta, self.K = popt
            else:
                # Fit all parameters
                popt, _ = curve_fit(hill_func, spend_valid, response_valid,
                                   p0=[response_valid.max(), 2.0, np.median(spend_valid)],
                                   bounds=([0, 0.5, 1e-6], 
                                          [response_valid.max() * 2, 5.0, spend_valid.max() * 10]))
                self.alpha, self.beta, self.K = popt
                
        except RuntimeError as e:
            print(f"Warning: Curve fitting failed: {e}")
            print("Using initial parameters")
        
        return self


class SigmoidSaturation:
    """
    Sigmoid (logistic) saturation curve.
    
    Alternative to Hill function with similar behavior but different
    mathematical properties.
    
    response = alpha / (1 + exp(-beta * (spend - K)))
    """
    
    def __init__(self, alpha: float = 1.0, beta: float = 1.0, K: float = 0.0):
        """
        Initialize sigmoid saturation.
        
        Parameters:
        -----------
        alpha : float
            Maximum response (saturation ceiling)
        beta : float
            Steepness parameter
        K : float
            Inflection point (spend at 50% of max)
        """
        self.alpha = alpha
        self.beta = beta
        self.K = K
        
    def transform(self, spend: np.ndarray) -> np.ndarray:
        """Apply sigmoid transformation."""
        spend = np.asarray(spend, dtype=float)
        return self.alpha / (1 + np.exp(-self.beta * (spend - self.K)))


class LinearSaturation:
    """
    Linear saturation with diminishing returns via square root.
    
    Simple alternative: response = alpha * sqrt(spend)
    """
    
    def __init__(self, alpha: float = 1.0):
        self.alpha = alpha
        
    def transform(self, spend: np.ndarray) -> np.ndarray:
        """Apply square root transformation."""
        spend = np.asarray(spend, dtype=float)
        return self.alpha * np.sqrt(np.maximum(spend, 0))


class ChannelSaturation:
    """
    Container for channel-specific saturation curves.
    """
    
    def __init__(self, channel_params: dict):
        """
        Initialize with per-channel parameters.
        
        Parameters:
        -----------
        channel_params : dict
            {channel_name: {'alpha': a, 'beta': b, 'K': k}}
        """
        self.saturation_curves = {}
        
        for channel, params in channel_params.items():
            self.saturation_curves[channel] = HillSaturation(
                alpha=params.get('alpha', 1.0),
                beta=params.get('beta', 2.0),
                K=params.get('K', 1.0)
            )
    
    def transform(self, df_dict: dict) -> dict:
        """
        Apply saturation to each channel.
        
        Parameters:
        -----------
        df_dict : dict
            {channel_name: spend_array}
            
        Returns:
        --------
        saturated : dict
            {channel_name: response_array}
        """
        return {
            channel: self.saturation_curves[channel].transform(spend)
            for channel, spend in df_dict.items()
            if channel in self.saturation_curves
        }


def estimate_saturation_params_from_data(
    spend: np.ndarray,
    response: np.ndarray,
    method: str = 'hill'
) -> dict:
    """
    Estimate saturation parameters from spend-response data.
    
    Parameters:
    -----------
    spend : np.ndarray
        Media spend
    response : np.ndarray
        Response metric
    method : str
        'hill' or 'sigmoid'
        
    Returns:
    --------
    params : dict
        Estimated parameters
    """
    valid_mask = (spend > 0) & (response >= 0)
    spend_valid = spend[valid_mask]
    response_valid = response[valid_mask]
    
    if method == 'hill':
        curve = HillSaturation()
        curve.fit(spend_valid, response_valid)
        return {
            'alpha': curve.alpha,
            'beta': curve.beta,
            'K': curve.K,
            'saturation_point_95': curve.get_saturation_point(0.95)
        }
    else:
        raise ValueError(f"Unknown method: {method}")


# Example usage
if __name__ == "__main__":
    # Test Hill function
    hill = HillSaturation(alpha=100, beta=2.0, K=5000)
    
    spend_levels = np.linspace(0, 20000, 100)
    response = hill.transform(spend_levels)
    marginal = hill.marginal_response(spend_levels)
    
    print("Hill Function Example:")
    print(f"Alpha: {hill.alpha}, Beta: {hill.beta}, K: {hill.K}")
    print(f"95% saturation point: ${hill.get_saturation_point(0.95):,.2f}")
    print(f"\nResponse at $1,000: {hill.transform(np.array([1000]))[0]:.2f}")
    print(f"Response at $5,000: {hill.transform(np.array([5000]))[0]:.2f}")
    print(f"Response at $10,000: {hill.transform(np.array([10000]))[0]:.2f}")
