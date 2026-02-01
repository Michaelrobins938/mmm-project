"""
Validation Framework for Media Mix Model

Validates MMM model performance against synthetic ground truth data.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
import json
from scipy import stats
import warnings


class MMMValidator:
    """
    Validator for Media Mix Model performance.
    
    Validates:
    - Parameter recovery accuracy (decay, beta, saturation)
    - ROI estimation accuracy
    - Prediction accuracy (MAPE, RMSE)
    - Budget optimization effectiveness
    - Model convergence diagnostics
    """
    
    def __init__(self, model, ground_truth: Optional[Dict] = None):
        """
        Initialize validator.
        
        Parameters:
        -----------
        model : BayesianMMM
            Fitted MMM model
        ground_truth : dict, optional
            Ground truth parameters (from synthetic data)
        """
        self.model = model
        self.ground_truth = ground_truth
        self.validation_results = {}
        
    def validate_parameter_recovery(self) -> Dict:
        """
        Validate how well model recovered true parameters.
        
        Returns:
        --------
        results : dict
            Parameter recovery metrics
        """
        if not self.ground_truth:
            raise ValueError("Ground truth required for parameter recovery validation")
        
        results = {
            'decay_recovery': {},
            'beta_recovery': {},
            'overall_accuracy': 0
        }
        
        total_error = 0
        n_params = 0
        
        for channel in self.model.channel_names:
            gt_params = self.ground_truth['channel_params'].get(channel, {})
            fitted_params = self.model.fitted_params['channels'].get(channel, {})
            
            # Validate decay
            if 'decay' in gt_params and 'decay' in fitted_params:
                true_decay = gt_params['decay']
                fitted_decay = fitted_params['decay']
                decay_error = abs(fitted_decay - true_decay) / true_decay
                
                results['decay_recovery'][channel] = {
                    'true': true_decay,
                    'fitted': fitted_decay,
                    'absolute_error': abs(fitted_decay - true_decay),
                    'relative_error': decay_error,
                    'recovery_score': max(0, 1 - decay_error)
                }
                
                total_error += decay_error
                n_params += 1
            
            # Validate beta (effectiveness)
            if 'beta_effect' in gt_params and 'beta' in fitted_params:
                true_beta = gt_params['beta_effect']
                fitted_beta = fitted_params['beta']
                beta_error = abs(fitted_beta - true_beta) / true_beta
                
                results['beta_recovery'][channel] = {
                    'true': true_beta,
                    'fitted': fitted_beta,
                    'absolute_error': abs(fitted_beta - true_beta),
                    'relative_error': beta_error,
                    'recovery_score': max(0, 1 - beta_error)
                }
                
                total_error += beta_error
                n_params += 1
        
        results['overall_accuracy'] = 1 - (total_error / n_params) if n_params > 0 else 0
        results['mean_relative_error'] = total_error / n_params if n_params > 0 else 0
        
        self.validation_results['parameter_recovery'] = results
        return results
    
    def validate_roi_accuracy(self, df: pd.DataFrame) -> Dict:
        """
        Validate ROI estimation accuracy.
        
        Parameters:
        -----------
        df : pd.DataFrame
            Data used for fitting
            
        Returns:
        --------
        results : dict
            ROI validation metrics
        """
        if not self.ground_truth:
            raise ValueError("Ground truth required for ROI validation")
        
        # Get estimated ROI from model
        estimated_roi = self.model.compute_roi(df)
        
        results = {
            'channel_roi': {},
            'overall_accuracy': 0
        }
        
        total_error = 0
        
        for channel in self.model.channel_names:
            true_roi = self.ground_truth['true_roi'].get(channel, 0)
            est_roi = estimated_roi.get(channel, {}).get('roi_mean', 0)
            
            # Handle cases where ROI is undefined
            if abs(true_roi) < 0.01:
                error = abs(est_roi)  # If true ROI ~0, error is just estimated value
            else:
                error = abs(est_roi - true_roi) / abs(true_roi)
            
            results['channel_roi'][channel] = {
                'true_roi': true_roi,
                'estimated_roi': est_roi,
                'absolute_error': abs(est_roi - true_roi),
                'relative_error': error,
                'within_95_ci': (
                    true_roi >= estimated_roi[channel]['roi_lower'] and
                    true_roi <= estimated_roi[channel]['roi_upper']
                ) if channel in estimated_roi else False
            }
            
            total_error += error
        
        n_channels = len(self.model.channel_names)
        results['mean_roi_error'] = total_error / n_channels
        results['overall_accuracy'] = max(0, 1 - results['mean_roi_error'])
        
        self.validation_results['roi_accuracy'] = results
        return results
    
    def validate_prediction_accuracy(
        self,
        df: pd.DataFrame,
        actual_col: str = 'revenue'
    ) -> Dict:
        """
        Validate prediction accuracy metrics.
        
        Parameters:
        -----------
        df : pd.DataFrame
            Data with actual values
        actual_col : str
            Name of actual target column
            
        Returns:
        --------
        results : dict
            Prediction accuracy metrics
        """
        predictions = self.model.predict(df)
        actual = df[actual_col].values
        predicted = predictions['mean']
        
        # MAPE
        mape = np.mean(np.abs((actual - predicted) / actual)) * 100
        
        # RMSE
        rmse = np.sqrt(np.mean((actual - predicted) ** 2))
        
        # MAE
        mae = np.mean(np.abs(actual - predicted))
        
        # R-squared
        ss_res = np.sum((actual - predicted) ** 2)
        ss_tot = np.sum((actual - np.mean(actual)) ** 2)
        r_squared = 1 - (ss_res / ss_tot)
        
        # Coverage of credible intervals
        lower = predictions['lower']
        upper = predictions['upper']
        coverage = np.mean((actual >= lower) & (actual <= upper)) * 100
        
        results = {
            'mape': mape,
            'rmse': rmse,
            'mae': mae,
            'r_squared': r_squared,
            'ci_coverage': coverage,
            'n_observations': len(actual),
            'pass_threshold': {
                'mape': mape < 10,  # Pass if MAPE < 10%
                'r_squared': r_squared > 0.8,  # Pass if R² > 0.8
                'ci_coverage': coverage > 90  # Pass if coverage > 90%
            }
        }
        
        self.validation_results['prediction_accuracy'] = results
        return results
    
    def validate_budget_optimization(
        self,
        optimizer,
        df: pd.DataFrame,
        n_trials: int = 100
    ) -> Dict:
        """
        Validate budget optimization effectiveness.
        
        Parameters:
        -----------
        optimizer : BudgetOptimizer
            Configured optimizer
        df : pd.DataFrame
            Historical data
        n_trials : int
            Number of random allocations to compare
            
        Returns:
        --------
        results : dict
            Optimization validation results
        """
        # Get optimal allocation
        opt_result = optimizer.optimize()
        optimal_contribution = opt_result['expected_contribution']
        
        # Generate random allocations for comparison
        random_contributions = []
        total_budget = optimizer.total_budget
        n_channels = len(optimizer.channel_names)
        
        for _ in range(n_trials):
            # Generate random allocation that sums to total budget
            random_alloc = np.random.dirichlet(np.ones(n_channels)) * total_budget
            contrib = -optimizer.objective(random_alloc)
            random_contributions.append(contrib)
        
        random_contributions = np.array(random_contributions)
        
        results = {
            'optimal_contribution': optimal_contribution,
            'mean_random_contribution': np.mean(random_contributions),
            'improvement_over_random': (
                (optimal_contribution - np.mean(random_contributions)) / 
                np.mean(random_contributions) * 100
            ),
            'percentile_rank': np.mean(optimal_contribution > random_contributions) * 100,
            'better_than_random': optimal_contribution > np.percentile(random_contributions, 95)
        }
        
        self.validation_results['budget_optimization'] = results
        return results
    
    def validate_model_convergence(self) -> Dict:
        """
        Validate MCMC convergence diagnostics.
        
        Returns:
        --------
        results : dict
            Convergence diagnostics
        """
        diagnostics = self.model.get_diagnostics()
        
        results = {
            'r_hat_max': diagnostics['r_hat_max'],
            'r_hat_min': diagnostics['r_hat_min'],
            'ess_min': diagnostics['ess_min'],
            'divergences': int(diagnostics['divergences']),
            'n_samples': int(diagnostics['n_samples']),
            'converged': diagnostics['converged'],
            'pass_threshold': {
                'r_hat': diagnostics['r_hat_max'] < 1.1,
                'divergences': diagnostics['divergences'] < 10,
                'ess': diagnostics['ess_min'] > 100
            }
        }
        
        self.validation_results['convergence'] = results
        return results
    
    def run_full_validation(
        self,
        df: pd.DataFrame,
        optimizer=None
    ) -> Dict:
        """
        Run complete validation suite.
        
        Parameters:
        -----------
        df : pd.DataFrame
            Data used for fitting
        optimizer : BudgetOptimizer, optional
            Optimizer to validate
            
        Returns:
        --------
        results : dict
            Complete validation results
        """
        print("Running MMM Model Validation...")
        print("=" * 50)
        
        # 1. Convergence diagnostics
        print("\n1. Checking MCMC Convergence...")
        conv_results = self.validate_model_convergence()
        print(f"   R-hat (max): {conv_results['r_hat_max']:.4f}")
        print(f"   Divergences: {conv_results['divergences']}")
        print(f"   Converged: {conv_results['converged']}")
        
        # 2. Prediction accuracy
        print("\n2. Validating Prediction Accuracy...")
        pred_results = self.validate_prediction_accuracy(df)
        print(f"   MAPE: {pred_results['mape']:.2f}%")
        print(f"   R²: {pred_results['r_squared']:.4f}")
        print(f"   CI Coverage: {pred_results['ci_coverage']:.1f}%")
        
        # 3. Parameter recovery (if ground truth available)
        if self.ground_truth:
            print("\n3. Validating Parameter Recovery...")
            param_results = self.validate_parameter_recovery()
            print(f"   Overall Accuracy: {param_results['overall_accuracy']:.2%}")
            print(f"   Mean Relative Error: {param_results['mean_relative_error']:.2%}")
            
            print("\n4. Validating ROI Accuracy...")
            roi_results = self.validate_roi_accuracy(df)
            print(f"   Mean ROI Error: {roi_results['mean_roi_error']:.2%}")
            print(f"   Overall Accuracy: {roi_results['overall_accuracy']:.2%}")
        
        # 4. Budget optimization (if optimizer provided)
        if optimizer:
            print("\n5. Validating Budget Optimization...")
            opt_results = self.validate_budget_optimization(optimizer, df)
            print(f"   Improvement over random: {opt_results['improvement_over_random']:.1f}%")
            print(f"   Percentile rank: {opt_results['percentile_rank']:.1f}%")
        
        # Overall summary
        print("\n" + "=" * 50)
        print("VALIDATION SUMMARY")
        print("=" * 50)
        
        all_passed = all([
            conv_results['converged'],
            pred_results['pass_threshold']['mape'],
            pred_results['pass_threshold']['r_squared'],
        ])
        
        if self.ground_truth:
            all_passed = all_passed and param_results['overall_accuracy'] > 0.7
        
        if optimizer:
            all_passed = all_passed and opt_results['better_than_random']
        
        print(f"Overall Validation: {'✅ PASSED' if all_passed else '❌ FAILED'}")
        
        self.validation_results['summary'] = {
            'all_passed': all_passed,
            'total_tests': len(self.validation_results),
            'timestamp': pd.Timestamp.now().isoformat()
        }
        
        return self.validation_results
    
    def save_validation_report(self, filepath: str):
        """Save validation results to JSON."""
        with open(filepath, 'w') as f:
            json.dump(self.validation_results, f, indent=2, default=str)
        print(f"Validation report saved to: {filepath}")


class ValidationSuite:
    """
    Run validation across multiple scenarios.
    """
    
    @staticmethod
    def run_validation_suite(
        model_class,
        n_datasets: int = 5,
        n_weeks: int = 104
    ) -> pd.DataFrame:
        """
        Run validation across multiple synthetic datasets.
        
        Parameters:
        -----------
        model_class : class
            MMM model class to validate
        n_datasets : int
            Number of datasets to test
        n_weeks : int
            Weeks per dataset
            
        Returns:
        --------
        results_df : pd.DataFrame
            Validation results across all datasets
        """
        from synthetic_data import generate_validation_datasets
        
        # Generate datasets
        filepaths = generate_validation_datasets('./data', n_datasets)
        
        results = []
        
        for i in range(0, len(filepaths), 2):
            data_path = filepaths[i]
            gt_path = filepaths[i + 1]
            
            # Load data
            df = pd.read_csv(data_path)
            with open(gt_path, 'r') as f:
                ground_truth = json.load(f)
            
            # Fit model
            channels = list(ground_truth['channel_params'].keys())
            model = model_class(channels)
            model.fit(df, target_col='revenue')
            
            # Validate
            validator = MMMValidator(model, ground_truth)
            val_results = validator.run_full_validation(df)
            
            # Collect results
            results.append({
                'dataset': data_path.split('/')[-1],
                'converged': val_results['convergence']['converged'],
                'mape': val_results['prediction_accuracy']['mape'],
                'r_squared': val_results['prediction_accuracy']['r_squared'],
                'param_accuracy': val_results.get('parameter_recovery', {}).get('overall_accuracy', 0),
                'roi_accuracy': val_results.get('roi_accuracy', {}).get('overall_accuracy', 0)
            })
        
        return pd.DataFrame(results)


# Example usage
if __name__ == "__main__":
    print("MMMValidator loaded successfully")
    print("\nTo run validation:")
    print("  validator = MMMValidator(model, ground_truth)")
    print("  results = validator.run_full_validation(df, optimizer)")
