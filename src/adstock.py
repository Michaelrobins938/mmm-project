"""
Adstock Transformation Module

Implements geometric adstock for modeling media carryover effects.
The adstock transformation captures the delayed impact of advertising
where media spend continues to have effect over time.
"""

import numpy as np
from typing import Union, List, Optional
import pandas as pd


class GeometricAdstock:
    """
    Geometric adstock transformation for media carryover effects.
    
    The carryover effect follows geometric decay:
    adstock_t = spend_t + decay * adstock_{t-1}
    
    Where decay is typically between 0.1 and 0.9, representing
    the fraction of effect carried over to the next time period.
    """
    
    def __init__(self, decay: float = 0.5, max_lag: int = 8):
        """
        Initialize geometric adstock.
        
        Parameters:
        -----------
        decay : float
            Decay rate (0.0 to 1.0). Higher = longer carryover.
        max_lag : int
            Maximum lag window for practical computation (default 8 weeks)
        """
        if not 0 <= decay <= 1:
            raise ValueError(f"Decay must be between 0 and 1, got {decay}")
        
        self.decay = decay
        self.max_lag = max_lag
        
    def transform(self, spend: Union[np.ndarray, pd.Series, List[float]]) -> np.ndarray:
        """
        Apply geometric adstock transformation.
        
        Parameters:
        -----------
        spend : array-like
            Media spend time series
            
        Returns:
        --------
        adstock : np.ndarray
            Transformed spend with carryover effects
        """
        spend = np.asarray(spend, dtype=float)
        n = len(spend)
        adstock = np.zeros(n)
        
        # Compute adstock recursively
        adstock[0] = spend[0]
        for t in range(1, n):
            adstock[t] = spend[t] + self.decay * adstock[t-1]
            
        return adstock
    
    def transform_vectorized(self, spend: np.ndarray) -> np.ndarray:
        """
        Vectorized adstock transformation for multiple channels.
        
        Parameters:
        -----------
        spend : np.ndarray
            Shape (n_timepoints, n_channels)
            
        Returns:
        --------
        adstock : np.ndarray
            Same shape as input with carryover applied per channel
        """
        if spend.ndim == 1:
            return self.transform(spend)
        
        n_timepoints, n_channels = spend.shape
        adstock = np.zeros_like(spend)
        
        adstock[0] = spend[0]
        for t in range(1, n_timepoints):
            adstock[t] = spend[t] + self.decay * adstock[t-1]
            
        return adstock
    
    def get_effective_half_life(self) -> float:
        """
        Calculate the effective half-life of the adstock.
        
        Returns:
        --------
        half_life : float
            Time periods for effect to decay to 50%
        """
        if self.decay >= 1:
            return np.inf
        return -np.log(2) / np.log(self.decay)
    
    def get_carryover_distribution(self, n_periods: Optional[int] = None) -> np.ndarray:
        """
        Get the carryover effect distribution over time.
        
        Shows what fraction of spend at time t affects time t+k.
        
        Parameters:
        -----------
        n_periods : int, optional
            Number of periods to compute (default: max_lag)
            
        Returns:
        --------
        distribution : np.ndarray
            Fraction of effect at each lag
        """
        if n_periods is None:
            n_periods = self.max_lag
            
        periods = np.arange(n_periods)
        distribution = self.decay ** periods
        return distribution / distribution.sum()


class ChannelSpecificAdstock:
    """
    Channel-specific adstock with different decay rates per channel.
    """
    
    def __init__(self, decays: dict, max_lag: int = 8):
        """
        Initialize with per-channel decay rates.
        
        Parameters:
        -----------
        decays : dict
            Mapping of channel name to decay rate
        max_lag : int
            Maximum lag window
        """
        self.decays = decays
        self.max_lag = max_lag
        self._adstocks = {
            channel: GeometricAdstock(decay, max_lag)
            for channel, decay in decays.items()
        }
    
    def transform(self, df: pd.DataFrame, channel_cols: List[str]) -> pd.DataFrame:
        """
        Apply channel-specific adstock to DataFrame.
        
        Parameters:
        -----------
        df : pd.DataFrame
            Input data with media spend columns
        channel_cols : List[str]
            Column names for media channels
            
        Returns:
        --------
        transformed : pd.DataFrame
            DataFrame with adstock-transformed columns
        """
        result = df.copy()
        
        for col in channel_cols:
            if col in self._adstocks:
                result[f"{col}_adstock"] = self._adstocks[col].transform(df[col].values)
            else:
                # Use default decay of 0.5 if not specified
                default_adstock = GeometricAdstock(0.5, self.max_lag)
                result[f"{col}_adstock"] = default_adstock.transform(df[col].values)
                
        return result


def delayed_adstock(spend: np.ndarray, decay: float, lag: int = 0) -> np.ndarray:
    """
    Adstock with explicit lag parameter for delayed response.
    
    Some channels (e.g., TV) may have an inherent delay before
    effects begin to accumulate.
    
    Parameters:
    -----------
    spend : np.ndarray
        Media spend time series
    decay : float
        Decay rate
    lag : int
        Initial delay periods before adstock accumulates
        
    Returns:
    --------
    adstock : np.ndarray
        Delayed adstock series
    """
    if lag == 0:
        return GeometricAdstock(decay).transform(spend)
    
    # Shift spend by lag periods
    shifted_spend = np.roll(spend, lag)
    shifted_spend[:lag] = 0  # Fill initial lag periods with zeros
    
    return GeometricAdstock(decay).transform(shifted_spend)


def compute_adstock_params_from_data(
    spend: np.ndarray,
    response: np.ndarray,
    max_lag: int = 8,
    n_decays: int = 20
) -> dict:
    """
    Estimate optimal adstock decay from data using correlation analysis.
    
    Parameters:
    -----------
    spend : np.ndarray
        Media spend series
    response : np.ndarray
        Response metric (e.g., conversions)
    max_lag : int
        Maximum lag to consider
    n_decays : int
        Number of decay values to test
        
    Returns:
    --------
    params : dict
        Dictionary with 'optimal_decay' and 'correlations'
    """
    decay_values = np.linspace(0.1, 0.9, n_decays)
    correlations = []
    
    for decay in decay_values:
        adstock = GeometricAdstock(decay, max_lag).transform(spend)
        # Compute correlation (handle potential NaN)
        valid_idx = ~(np.isnan(adstock) | np.isnan(response))
        if valid_idx.sum() > 10:
            corr = np.corrcoef(adstock[valid_idx], response[valid_idx])[0, 1]
            correlations.append(corr if not np.isnan(corr) else -999)
        else:
            correlations.append(-999)
    
    correlations = np.array(correlations)
    optimal_idx = np.argmax(correlations)
    
    return {
        'optimal_decay': decay_values[optimal_idx],
        'max_correlation': correlations[optimal_idx],
        'decay_values': decay_values,
        'correlations': correlations
    }


# Example usage
if __name__ == "__main__":
    # Test with sample data
    np.random.seed(42)
    spend = np.random.exponential(1000, 52)  # 52 weeks of spend
    
    # Apply different decay rates
    fast_decay = GeometricAdstock(decay=0.3).transform(spend)
    medium_decay = GeometricAdstock(decay=0.5).transform(spend)
    slow_decay = GeometricAdstock(decay=0.7).transform(spend)
    
    print("Sample spend (first 10 periods):", spend[:10].round(2))
    print("Fast decay adstock:", fast_decay[:10].round(2))
    print("Medium decay adstock:", medium_decay[:10].round(2))
    print("Slow decay adstock:", slow_decay[:10].round(2))
    
    # Half-life calculations
    print(f"\nHalf-life at decay=0.3: {GeometricAdstock(0.3).get_effective_half_life():.2f} periods")
    print(f"Half-life at decay=0.5: {GeometricAdstock(0.5).get_effective_half_life():.2f} periods")
    print(f"Half-life at decay=0.7: {GeometricAdstock(0.7).get_effective_half_life():.2f} periods")
