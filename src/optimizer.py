"""
Budget Optimizer for Media Mix Model

Implements constrained optimization for allocating media budgets
to maximize expected return on investment.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from scipy.optimize import minimize, differential_evolution
from scipy.optimize import LinearConstraint, NonlinearConstraint
import warnings

from .adstock import GeometricAdstock
from .saturation import HillSaturation


class BudgetOptimizer:
    """
    Optimizer for media budget allocation.
    
    Uses the fitted MMM to find the budget allocation that maximizes
total expected contribution subject to constraints.
    
    Optimization formulation:
    max: sum(channel_contributions(budget))
    subject to:
        - sum(budget) <= total_budget
        - budget_i >= min_budget_i (for each channel)
        - budget_i <= max_budget_i (for each channel)
    """
    
    def __init__(
        self,
        channel_names: List[str],
        channel_params: Dict[str, Dict],
        total_budget: float,
        use_adstock: bool = True,
        use_saturation: bool = True
    ):
        """
        Initialize budget optimizer.
        
        Parameters:
        -----------
        channel_names : List[str]
            Names of media channels
        channel_params : dict
            Fitted parameters from MMM for each channel:
            {
                'TV': {'beta': 0.5, 'decay': 0.7, 'alpha_sat': 1000, 'K_sat': 5000},
                ...
            }
        total_budget : float
            Total budget to allocate
        use_adstock : bool
            Whether to use adstock in optimization
        use_saturation : bool
            Whether to use saturation in optimization
        """
        self.channel_names = channel_names
        self.n_channels = len(channel_names)
        self.channel_params = channel_params
        self.total_budget = total_budget
        self.use_adstock = use_adstock
        self.use_saturation = use_saturation
        
        # Budget constraints
        self.min_budgets = {channel: 0 for channel in channel_names}
        self.max_budgets = {channel: total_budget for channel in channel_names}
        
        # Build response functions for each channel
        self._build_response_functions()
    
    def _build_response_functions(self):
        """Build response prediction functions for each channel."""
        self.response_funcs = {}
        
        for channel in self.channel_names:
            params = self.channel_params.get(channel, {})
            
            def make_response_fn(channel, params):
                def response_fn(budget):
                    # Apply adstock if enabled
                    if self.use_adstock and 'decay' in params:
                        # For single-period optimization, we approximate adstock
                        # as a multiplier based on the decay rate
                        adstock_multiplier = 1 / (1 - params['decay'])
                        effective_budget = budget * adstock_multiplier
                    else:
                        effective_budget = budget
                    
                    # Apply saturation if enabled
                    if self.use_saturation and 'alpha_sat' in params and 'K_sat' in params:
                        # Hill saturation: alpha * x / (K + x)
                        alpha = params['alpha_sat']
                        K = params['K_sat']
                        saturated = alpha * effective_budget / (effective_budget + K)
                    else:
                        saturated = effective_budget
                    
                    # Apply effectiveness coefficient
                    beta = params.get('beta', 1.0)
                    contribution = beta * saturated
                    
                    return contribution
                
                return response_fn
            
            self.response_funcs[channel] = make_response_fn(channel, params)
    
    def set_constraints(
        self,
        min_budgets: Optional[Dict[str, float]] = None,
        max_budgets: Optional[Dict[str, float]] = None
    ):
        """
        Set budget constraints per channel.
        
        Parameters:
        -----------
        min_budgets : dict, optional
            Minimum budget per channel {channel: min_amount}
        max_budgets : dict, optional
            Maximum budget per channel {channel: max_amount}
        """
        if min_budgets:
            for channel, amount in min_budgets.items():
                if channel in self.min_budgets:
                    self.min_budgets[channel] = amount
        
        if max_budgets:
            for channel, amount in max_budgets.items():
                if channel in self.max_budgets:
                    self.max_budgets[channel] = amount
    
    def objective(self, budget_allocation: np.ndarray) -> float:
        """
        Objective function to minimize (negative total contribution).
        
        Parameters:
        -----------
        budget_allocation : np.ndarray
            Budget amounts for each channel
            
        Returns:
        --------
        negative_contribution : float
            Negative of total expected contribution (for minimization)
        """
        total_contribution = 0
        
        for i, channel in enumerate(self.channel_names):
            response_fn = self.response_funcs[channel]
            total_contribution += response_fn(budget_allocation[i])
        
        return -total_contribution
    
    def optimize(
        self,
        method: str = 'SLSQP',
        initial_budget: Optional[np.ndarray] = None,
        verbose: bool = False
    ) -> Dict:
        """
        Run budget optimization.
        
        Parameters:
        -----------
        method : str
            Optimization method: 'SLSQP', 'L-BFGS-B', or 'differential_evolution'
        initial_budget : np.ndarray, optional
            Initial budget allocation guess
        verbose : bool
            Print optimization progress
            
        Returns:
        --------
        results : dict
            Optimization results with 'optimal_budget', 'expected_contribution',
            'roi', and 'marginal_returns'
        """
        # Set bounds
        bounds = []
        for channel in self.channel_names:
            bounds.append((
                self.min_budgets[channel],
                self.max_budgets[channel]
            ))
        
        # Total budget constraint
        def budget_constraint(x):
            return np.sum(x) - self.total_budget
        
        # Initial guess
        if initial_budget is None:
            initial_budget = np.ones(self.n_channels) * self.total_budget / self.n_channels
        
        # Run optimization
        if method == 'differential_evolution':
            # Global optimization
            result = differential_evolution(
                self.objective,
                bounds,
                maxiter=1000,
                tol=1e-7,
                polish=True,
                workers=-1,
                disp=verbose
            )
        else:
            # Local optimization with constraints
            constraints = {'type': 'eq', 'fun': budget_constraint}
            
            result = minimize(
                self.objective,
                initial_budget,
                method=method,
                bounds=bounds,
                constraints=constraints,
                options={'maxiter': 1000, 'ftol': 1e-9}
            )
        
        # Extract results
        optimal_budget = result.x
        expected_contribution = -result.fun
        
        # Compute ROI and marginal returns per channel
        rois = {}
        marginal_returns = {}
        
        for i, channel in enumerate(self.channel_names):
            contribution = self.response_funcs[channel](optimal_budget[i])
            rois[channel] = (contribution - optimal_budget[i]) / optimal_budget[i] if optimal_budget[i] > 0 else 0
            
            # Compute marginal return (derivative) numerically
            epsilon = optimal_budget[i] * 0.001
            if epsilon < 1:
                epsilon = 1
            
            contrib_plus = self.response_funcs[channel](optimal_budget[i] + epsilon)
            marginal = (contrib_plus - contribution) / epsilon
            marginal_returns[channel] = marginal
        
        return {
            'optimal_budget': dict(zip(self.channel_names, optimal_budget)),
            'expected_contribution': expected_contribution,
            'total_budget': self.total_budget,
            'net_profit': expected_contribution - self.total_budget,
            'roi': rois,
            'marginal_returns': marginal_returns,
            'optimization_success': result.success,
            'optimization_message': result.message
        }
    
    def sensitivity_analysis(
        self,
        budget_range: np.ndarray,
        channel: str
    ) -> Dict[str, np.ndarray]:
        """
        Analyze sensitivity of channel response to budget changes.
        
        Parameters:
        -----------
        budget_range : np.ndarray
            Budget levels to test
        channel : str
            Channel to analyze
            
        Returns:
        --------
        sensitivity : dict
            Budget levels, contributions, and ROI at each level
        """
        response_fn = self.response_funcs[channel]
        
        contributions = np.array([response_fn(b) for b in budget_range])
        rois = np.where(budget_range > 0, (contributions - budget_range) / budget_range, 0)
        
        # Compute marginal returns numerically
        marginal = np.gradient(contributions, budget_range)
        
        return {
            'budget': budget_range,
            'contribution': contributions,
            'roi': rois,
            'marginal_return': marginal
        }
    
    def scenario_comparison(
        self,
        scenarios: List[Dict[str, float]]
    ) -> pd.DataFrame:
        """
        Compare multiple budget scenarios.
        
        Parameters:
        -----------
        scenarios : List[dict]
            List of budget allocations, each a dict {channel: budget}
            
        Returns:
        --------
        comparison : pd.DataFrame
            DataFrame comparing scenarios on key metrics
        """
        results = []
        
        for i, scenario in enumerate(scenarios):
            # Build budget array in correct order
            budget_array = np.array([scenario.get(channel, 0) for channel in self.channel_names])
            
            # Compute metrics
            total_contribution = -self.objective(budget_array)
            total_budget = sum(scenario.values())
            
            scenario_result = {
                'scenario_id': i,
                'total_budget': total_budget,
                'expected_contribution': total_contribution,
                'net_profit': total_contribution - total_budget,
                'overall_roi': (total_contribution - total_budget) / total_budget if total_budget > 0 else 0
            }
            
            # Add per-channel metrics
            for channel in self.channel_names:
                budget = scenario.get(channel, 0)
                contribution = self.response_funcs[channel](budget)
                scenario_result[f'{channel}_budget'] = budget
                scenario_result[f'{channel}_contribution'] = contribution
                scenario_result[f'{channel}_roi'] = (contribution - budget) / budget if budget > 0 else 0
            
            results.append(scenario_result)
        
        return pd.DataFrame(results)
    
    def recommend_budget_change(
        self,
        current_budget: Dict[str, float],
        confidence_threshold: float = 0.95
    ) -> Dict:
        """
        Recommend budget changes from current allocation.
        
        Parameters:
        -----------
        current_budget : dict
            Current budget allocation {channel: budget}
        confidence_threshold : float
            Confidence level for recommendations
            
        Returns:
        --------
        recommendations : dict
            Specific budget change recommendations
        """
        # Get optimal allocation
        opt_result = self.optimize()
        optimal_budget = opt_result['optimal_budget']
        
        # Calculate changes
        changes = {}
        for channel in self.channel_names:
            current = current_budget.get(channel, 0)
            optimal = optimal_budget[channel]
            
            abs_change = optimal - current
            pct_change = (abs_change / current * 100) if current > 0 else float('inf')
            
            changes[channel] = {
                'current': current,
                'recommended': optimal,
                'absolute_change': abs_change,
                'percentage_change': pct_change,
                'action': 'increase' if abs_change > 0 else 'decrease' if abs_change < 0 else 'maintain'
            }
        
        # Compute expected impact
        current_array = np.array([current_budget.get(c, 0) for c in self.channel_names])
        optimal_array = np.array([optimal_budget[c] for c in self.channel_names])
        
        current_contribution = -self.objective(current_array)
        optimal_contribution = -self.objective(optimal_array)
        
        return {
            'recommendations': changes,
            'current_total_contribution': current_contribution,
            'optimal_total_contribution': optimal_contribution,
            'expected_improvement': optimal_contribution - current_contribution,
            'expected_improvement_pct': ((optimal_contribution - current_contribution) / current_contribution * 100) 
                                       if current_contribution > 0 else 0
        }


def compute_budget_efficiency_frontier(
    optimizer: BudgetOptimizer,
    budget_levels: np.ndarray
) -> pd.DataFrame:
    """
    Compute the budget efficiency frontier showing ROI vs budget level.
    
    Parameters:
    -----------
    optimizer : BudgetOptimizer
        Configured optimizer instance
    budget_levels : np.ndarray
        Range of total budgets to evaluate
        
    Returns:
    --------
    frontier : pd.DataFrame
        Efficiency frontier data
    """
    results = []
    
    for budget in budget_levels:
        # Create new optimizer with this budget
        opt = BudgetOptimizer(
            optimizer.channel_names,
            optimizer.channel_params,
            budget,
            optimizer.use_adstock,
            optimizer.use_saturation
        )
        opt.min_budgets = optimizer.min_budgets
        opt.max_budgets = optimizer.max_budgets
        
        result = opt.optimize()
        
        results.append({
            'total_budget': budget,
            'expected_contribution': result['expected_contribution'],
            'net_profit': result['net_profit'],
            'overall_roi': result['net_profit'] / budget if budget > 0 else 0
        })
    
    return pd.DataFrame(results)


# Example usage
if __name__ == "__main__":
    print("BudgetOptimizer module loaded successfully")
    
    # Example parameters
    channel_params = {
        'TV': {'beta': 0.8, 'decay': 0.7, 'alpha_sat': 50000, 'K_sat': 10000},
        'Radio': {'beta': 0.6, 'decay': 0.5, 'alpha_sat': 30000, 'K_sat': 5000},
        'Digital': {'beta': 1.2, 'decay': 0.3, 'alpha_sat': 40000, 'K_sat': 8000}
    }
    
    optimizer = BudgetOptimizer(
        ['TV', 'Radio', 'Digital'],
        channel_params,
        total_budget=100000
    )
    
    # Set constraints
    optimizer.set_constraints(
        min_budgets={'TV': 10000, 'Radio': 5000, 'Digital': 5000},
        max_budgets={'TV': 60000, 'Radio': 40000, 'Digital': 50000}
    )
    
    print("\nOptimizer initialized. Call optimize() to run optimization.")
