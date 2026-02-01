"""
Synthetic Data Generator for Media Mix Model

Generates realistic synthetic media mix data with known ground truth
to validate the MMM model performance.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import json


class SyntheticMMMDataGenerator:
    """
    Generator for realistic MMM synthetic data.
    
    Creates time series data with:
    - Media spend patterns (TV, Radio, Digital, Social, OOH)
    - Adstock effects with specified decay rates
    - Saturation curves (Hill function)
    - Seasonality (weekly/yearly patterns)
    - Trend component
    - Noise
    - Control variables (price, promotions, etc.)
    
    Ground truth parameters are preserved for validation.
    """
    
    def __init__(
        self,
        start_date: str = '2022-01-01',
        n_weeks: int = 104,  # 2 years of weekly data
        channels: List[str] = None,
        random_state: int = 42
    ):
        """
        Initialize synthetic data generator.
        
        Parameters:
        -----------
        start_date : str
            Start date in 'YYYY-MM-DD' format
        n_weeks : int
            Number of weeks to generate
        channels : List[str], optional
            Media channel names (default: ['TV', 'Radio', 'Digital', 'Social'])
        random_state : int
            Random seed for reproducibility
        """
        self.start_date = pd.to_datetime(start_date)
        self.n_weeks = n_weeks
        self.channels = channels or ['TV', 'Radio', 'Digital', 'Social']
        self.random_state = random_state
        
        np.random.seed(random_state)
        
        # Ground truth parameters (will be set during generation)
        self.ground_truth = {}
        
    def generate(
        self,
        base_revenue: float = 100000,
        trend_rate: float = 0.002,  # 0.2% weekly growth
        seasonality_amplitude: float = 0.15,
        noise_level: float = 0.05,
        channel_params: Optional[Dict] = None
    ) -> Tuple[pd.DataFrame, Dict]:
        """
        Generate complete synthetic MMM dataset.
        
        Parameters:
        -----------
        base_revenue : float
            Baseline revenue without media
        trend_rate : float
            Weekly trend growth rate
        seasonality_amplitude : float
            Seasonal variation as fraction of base
        noise_level : float
            Standard deviation of noise as fraction of base
        channel_params : dict, optional
            Override default channel parameters
            
        Returns:
        --------
        df : pd.DataFrame
            Generated dataset with columns:
            - date, week, year
            - {channel}_spend for each channel
            - revenue (target)
            - price, promotion (controls)
            - ground truth components
        ground_truth : dict
            True parameters used for generation
        """
        # Default channel parameters
        default_params = {
            'TV': {
                'spend_mean': 15000,
                'spend_std': 5000,
                'decay': 0.7,
                'alpha_sat': 50000,
                'beta_sat': 2.0,
                'K_sat': 10000,
                'beta_effect': 0.8,
                'spike_frequency': 0.15,  # % of weeks with campaigns
                'spike_multiplier': 2.5
            },
            'Radio': {
                'spend_mean': 8000,
                'spend_std': 3000,
                'decay': 0.5,
                'alpha_sat': 30000,
                'beta_sat': 2.0,
                'K_sat': 5000,
                'beta_effect': 0.6,
                'spike_frequency': 0.10,
                'spike_multiplier': 2.0
            },
            'Digital': {
                'spend_mean': 12000,
                'spend_std': 4000,
                'decay': 0.3,
                'alpha_sat': 40000,
                'beta_sat': 1.8,
                'K_sat': 8000,
                'beta_effect': 1.2,
                'spike_frequency': 0.25,
                'spike_multiplier': 1.8
            },
            'Social': {
                'spend_mean': 6000,
                'spend_std': 2500,
                'decay': 0.2,
                'alpha_sat': 25000,
                'beta_sat': 1.5,
                'K_sat': 4000,
                'beta_effect': 1.0,
                'spike_frequency': 0.20,
                'spike_multiplier': 1.5
            }
        }
        
        # Merge with user-provided params
        if channel_params:
            for channel, params in channel_params.items():
                if channel in default_params:
                    default_params[channel].update(params)
                else:
                    default_params[channel] = params
        
        self.ground_truth['channel_params'] = default_params
        
        # Generate date range
        dates = pd.date_range(start=self.start_date, periods=self.n_weeks, freq='W')
        
        # Initialize dataframe
        df = pd.DataFrame({
            'date': dates,
            'week': range(self.n_weeks),
            'year': dates.year,
            'month': dates.month
        })
        
        # Generate media spend for each channel
        channel_spends = {}
        for channel in self.channels:
            params = default_params[channel]
            
            # Base spend pattern
            base_spend = np.random.normal(
                params['spend_mean'],
                params['spend_std'],
                self.n_weeks
            )
            base_spend = np.maximum(base_spend, 0)  # No negative spend
            
            # Add campaign spikes
            spike_mask = np.random.random(self.n_weeks) < params['spike_frequency']
            base_spend[spike_mask] *= params['spike_multiplier']
            
            channel_spends[channel] = base_spend
            df[f'{channel}_spend'] = base_spend
        
        # Generate control variables
        df['price'] = 100 + np.random.normal(0, 5, self.n_weeks)  # Product price
        df['promotion'] = np.random.random(self.n_weeks) < 0.15  # Promotion flag
        
        # Generate base components
        trend = base_revenue * (1 + trend_rate) ** np.arange(self.n_weeks)
        
        # Seasonality (weekly pattern + yearly pattern)
        weekly_pattern = np.sin(2 * np.pi * np.arange(self.n_weeks) / 52)
        yearly_pattern = np.sin(2 * np.pi * np.arange(self.n_weeks) / 52)
        seasonality = base_revenue * seasonality_amplitude * (weekly_pattern + yearly_pattern * 0.5)
        
        # Compute media contributions
        media_contributions = {}
        total_media_contribution = np.zeros(self.n_weeks)
        
        for channel in self.channels:
            params = default_params[channel]
            spend = channel_spends[channel]
            
            # Apply adstock (geometric decay)
            adstock_spend = np.zeros(self.n_weeks)
            adstock_spend[0] = spend[0]
            for t in range(1, self.n_weeks):
                adstock_spend[t] = spend[t] + params['decay'] * adstock_spend[t-1]
            
            # Apply saturation (Hill function)
            # response = alpha * spend^beta / (K^beta + spend^beta)
            numerator = params['alpha_sat'] * (adstock_spend ** params['beta_sat'])
            denominator = (params['K_sat'] ** params['beta_sat']) + (adstock_spend ** params['beta_sat'])
            saturated_response = numerator / denominator
            
            # Apply effectiveness coefficient
            contribution = params['beta_effect'] * saturated_response
            
            media_contributions[channel] = contribution
            total_media_contribution += contribution
            
            df[f'{channel}_contribution_gt'] = contribution  # Ground truth
        
        # Control variable effects
        price_effect = -500 * (df['price'].values - 100)  # Negative price elasticity
        promotion_effect = np.where(df['promotion'].values, 8000, 0)
        
        # Generate revenue with noise
        noise = np.random.normal(0, base_revenue * noise_level, self.n_weeks)
        
        df['revenue'] = (
            base_revenue +
            trend +
            seasonality +
            total_media_contribution +
            price_effect +
            promotion_effect +
            noise
        )
        
        # Ensure positive revenue
        df['revenue'] = np.maximum(df['revenue'], 0)
        
        # Store ground truth
        self.ground_truth = {
            'base_revenue': base_revenue,
            'trend_rate': trend_rate,
            'seasonality_amplitude': seasonality_amplitude,
            'noise_level': noise_level,
            'channel_params': default_params,
            'total_media_spend': {ch: channel_spends[ch].sum() for ch in self.channels},
            'total_media_contribution': {ch: media_contributions[ch].sum() for ch in self.channels},
            'true_roi': {
                ch: (media_contributions[ch].sum() - channel_spends[ch].sum()) / channel_spends[ch].sum()
                for ch in self.channels
            }
        }
        
        # Add ground truth total contribution column
        df['total_media_contribution_gt'] = total_media_contribution
        
        return df, self.ground_truth
    
    def save_ground_truth(self, filepath: str):
        """Save ground truth parameters to JSON file."""
        with open(filepath, 'w') as f:
            json.dump(self.ground_truth, f, indent=2, default=str)
    
    @staticmethod
    def load_ground_truth(filepath: str) -> Dict:
        """Load ground truth parameters from JSON file."""
        with open(filepath, 'r') as f:
            return json.load(f)


class ScenarioGenerator:
    """
    Generate specific test scenarios for validation.
    """
    
    SCENARIOS = {
        'high_tv_effectiveness': {
            'TV': {'beta_effect': 1.5, 'decay': 0.8}
        },
        'digital_dominant': {
            'Digital': {'beta_effect': 2.0, 'decay': 0.4},
            'TV': {'beta_effect': 0.5}
        },
        'long_adstock': {
            'TV': {'decay': 0.85},
            'Radio': {'decay': 0.7}
        },
        'quick_saturation': {
            'TV': {'alpha_sat': 30000, 'K_sat': 5000},
            'Digital': {'alpha_sat': 25000, 'K_sat': 4000}
        }
    }
    
    @classmethod
    def generate_scenario(
        cls,
        scenario_name: str,
        n_weeks: int = 104,
        random_state: int = 42
    ) -> Tuple[pd.DataFrame, Dict]:
        """
        Generate a specific test scenario.
        
        Parameters:
        -----------
        scenario_name : str
            Name of predefined scenario
        n_weeks : int
            Number of weeks
        random_state : int
            Random seed
            
        Returns:
        --------
        df : pd.DataFrame
            Generated data
        ground_truth : dict
            Ground truth parameters
        """
        if scenario_name not in cls.SCENARIOS:
            raise ValueError(f"Unknown scenario: {scenario_name}. Available: {list(cls.SCENARIOS.keys())}")
        
        generator = SyntheticMMMDataGenerator(
            n_weeks=n_weeks,
            random_state=random_state
        )
        
        return generator.generate(channel_params=cls.SCENARIOS[scenario_name])


def generate_validation_datasets(
    output_dir: str = './data',
    n_datasets: int = 5
) -> List[str]:
    """
    Generate multiple validation datasets with different characteristics.
    
    Parameters:
    -----------
    output_dir : str
        Directory to save datasets
    n_datasets : int
        Number of datasets to generate
        
    Returns:
    --------
    filepaths : List[str]
        Paths to generated files
    """
    import os
    os.makedirs(output_dir, exist_ok=True)
    
    filepaths = []
    
    scenarios = [
        ('baseline', {}),
        ('high_tv', {'TV': {'beta_effect': 1.5}}),
        ('digital_first', {'Digital': {'beta_effect': 1.8, 'decay': 0.3}}),
        ('strong_adstock', {'TV': {'decay': 0.8}, 'Radio': {'decay': 0.6}}),
        ('quick_saturation', {'TV': {'K_sat': 3000}, 'Digital': {'K_sat': 2500}})
    ]
    
    for i, (name, params) in enumerate(scenarios[:n_datasets]):
        generator = SyntheticMMMDataGenerator(
            n_weeks=104,
            random_state=42 + i
        )
        
        df, ground_truth = generator.generate(channel_params=params)
        
        # Save data
        data_path = f'{output_dir}/synthetic_mmm_{name}.csv'
        df.to_csv(data_path, index=False)
        
        # Save ground truth
        gt_path = f'{output_dir}/ground_truth_{name}.json'
        generator.save_ground_truth(gt_path)
        
        filepaths.extend([data_path, gt_path])
        
        print(f"Generated dataset: {name}")
        print(f"  - Data: {data_path}")
        print(f"  - Ground truth: {gt_path}")
        print(f"  - Channels: {list(ground_truth['total_media_spend'].keys())}")
        print(f"  - Total revenue: ${df['revenue'].sum():,.0f}")
        print(f"  - Total media spend: ${sum(ground_truth['total_media_spend'].values()):,.0f}")
        print()
    
    return filepaths


# Example usage
if __name__ == "__main__":
    print("SyntheticMMMDataGenerator loaded successfully")
    print("\nGenerating example dataset...")
    
    # Generate a sample dataset
    generator = SyntheticMMMDataGenerator(n_weeks=52)
    df, ground_truth = generator.generate()
    
    print(f"\nDataset shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print(f"\nFirst few rows:")
    print(df.head())
    
    print(f"\nGround truth ROI by channel:")
    for channel, roi in ground_truth['true_roi'].items():
        print(f"  {channel}: {roi:.2%}")
    
    print(f"\nTo generate validation datasets, run:")
    print(f"  generate_validation_datasets('./data', 5)")
