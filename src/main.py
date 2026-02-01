"""
Main entry point for Bayesian Media Mix Model (MMM)

Run complete MMM pipeline: generate data, fit model, optimize budget, validate.
"""

import numpy as np
import pandas as pd
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from synthetic_data import SyntheticMMMDataGenerator, generate_validation_datasets
from bayesian_mmm import BayesianMMM
from optimizer import BudgetOptimizer
from validation import MMMValidator


def run_demo(n_weeks: int = 104):
    """
    Run complete MMM demonstration pipeline.
    
    Parameters:
    -----------
    n_weeks : int
        Number of weeks of data to generate
    """
    print("=" * 70)
    print("BAYESIAN MEDIA MIX MODEL (MMM) - DEMONSTRATION")
    print("=" * 70)
    
    # Step 1: Generate synthetic data
    print("\n📊 STEP 1: Generating Synthetic Data")
    print("-" * 70)
    
    generator = SyntheticMMMDataGenerator(
        start_date='2022-01-01',
        n_weeks=n_weeks,
        channels=['TV', 'Radio', 'Digital', 'Social']
    )
    
    df, ground_truth = generator.generate(
        base_revenue=100000,
        trend_rate=0.002,
        seasonality_amplitude=0.15,
        noise_level=0.05
    )
    
    print(f"✓ Generated {len(df)} weeks of data")
    print(f"✓ Channels: {', '.join(generator.channels)}")
    print(f"✓ Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"✓ Total revenue: ${df['revenue'].sum():,.0f}")
    
    # Display ground truth ROI
    print("\n📈 Ground Truth ROI by Channel:")
    for channel, roi in ground_truth['true_roi'].items():
        spend = ground_truth['total_media_spend'][channel]
        contribution = ground_truth['total_media_contribution'][channel]
        print(f"  {channel:12} ROI: {roi:7.1%}  |  Spend: ${spend:>10,.0f}  |  Contribution: ${contribution:>10,.0f}")
    
    # Save data
    df.to_csv('./data/demo_data.csv', index=False)
    generator.save_ground_truth('./data/ground_truth.json')
    print("\n✓ Data saved to ./data/demo_data.csv")
    
    # Step 2: Fit Bayesian MMM
    print("\n" + "=" * 70)
    print("🤖 STEP 2: Fitting Bayesian MMM")
    print("-" * 70)
    
    channels = ['TV', 'Radio', 'Digital', 'Social']
    
    model = BayesianMMM(
        channel_names=channels,
        use_adstock=True,
        use_saturation=True,
        use_trend=True,
        use_seasonality=True,
        sampler_config={
            'draws': 500,  # Reduced for demo speed
            'tune': 500,
            'chains': 4,
            'cores': 4,
            'target_accept': 0.95
        }
    )
    
    print("⏳ Fitting model (this may take 5-10 minutes)...")
    model.fit(df, target_col='revenue', control_cols=['price', 'promotion'])
    print("✓ Model fitting complete!")
    
    # Display fitted parameters
    print("\n📊 Fitted Channel Parameters:")
    for channel in channels:
        params = model.fitted_params['channels'][channel]
        print(f"\n  {channel}:")
        if 'beta' in params:
            print(f"    Effectiveness (β): {params['beta']:.4f}")
        if 'decay' in params:
            print(f"    Adstock decay:     {params['decay']:.4f}")
        if 'alpha_sat' in params:
            print(f"    Saturation α:      {params['alpha_sat']:.0f}")
        if 'K_sat' in params:
            print(f"    Saturation K:      {params['K_sat']:.0f}")
    
    # Step 3: Compute ROI
    print("\n" + "=" * 70)
    print("💰 STEP 3: Computing Return on Investment (ROI)")
    print("-" * 70)
    
    roi_results = model.compute_roi(df)
    
    print("📈 Estimated ROI by Channel:")
    for channel, metrics in roi_results.items():
        print(f"\n  {channel}:")
        print(f"    Mean ROI:  {metrics['roi_mean']:7.1%}")
        print(f"    95% CI:    [{metrics['roi_lower']:7.1%}, {metrics['roi_upper']:7.1%}]")
        print(f"    Total Spend:      ${metrics['total_spend']:,.0f}")
        print(f"    Est. Contribution: ${metrics['total_contribution']:,.0f}")
    
    # Step 4: Budget Optimization
    print("\n" + "=" * 70)
    print("🎯 STEP 4: Budget Optimization")
    print("-" * 70)
    
    # Prepare channel params for optimizer
    channel_params = {}
    for channel in channels:
        params = model.fitted_params['channels'][channel]
        channel_params[channel] = {
            'beta': params.get('beta', 1.0),
            'decay': params.get('decay', 0.5),
            'alpha_sat': params.get('alpha_sat', 50000),
            'K_sat': params.get('K_sat', 10000)
        }
    
    # Total budget (sum of historical spend)
    total_budget = sum(ground_truth['total_media_spend'].values())
    
    optimizer = BudgetOptimizer(
        channels,
        channel_params,
        total_budget
    )
    
    # Set constraints (min 10% in each channel, max 60% in any channel)
    min_budget = total_budget * 0.10
    max_budget = total_budget * 0.60
    optimizer.set_constraints(
        min_budgets={ch: min_budget for ch in channels},
        max_budgets={ch: max_budget for ch in channels}
    )
    
    print(f"⏳ Optimizing ${total_budget:,.0f} budget allocation...")
    opt_result = optimizer.optimize(method='SLSQP')
    
    print("\n✅ Optimal Budget Allocation:")
    print(f"\n{'Channel':<12} {'Current':>12} {'Optimal':>12} {'Change':>12} {'% Change':>10}")
    print("-" * 62)
    
    for channel in channels:
        current = ground_truth['total_media_spend'][channel]
        optimal = opt_result['optimal_budget'][channel]
        change = optimal - current
        pct_change = (change / current * 100) if current > 0 else 0
        
        print(f"{channel:<12} ${current:>11,.0f} ${optimal:>11,.0f} ${change:>+11,.0f} {pct_change:>+9.1f}%")
    
    print(f"\n📊 Optimization Results:")
    print(f"  Expected Total Contribution: ${opt_result['expected_contribution']:,.0f}")
    print(f"  Net Profit:                  ${opt_result['net_profit']:,.0f}")
    print(f"  Optimization Successful:     {opt_result['optimization_success']}")
    
    # Step 5: Validation
    print("\n" + "=" * 70)
    print("✅ STEP 5: Model Validation")
    print("-" * 70)
    
    validator = MMMValidator(model, ground_truth)
    val_results = validator.run_full_validation(df, optimizer)
    
    # Final summary
    print("\n" + "=" * 70)
    print("🎉 MMM DEMONSTRATION COMPLETE!")
    print("=" * 70)
    print("\n✅ What you've built:")
    print("   • Bayesian MMM with adstock & saturation")
    print("   • ROI estimation with uncertainty quantification")
    print("   • Budget optimizer with constraints")
    print("   • Full validation framework")
    print("\n📁 Output files:")
    print("   • ./data/demo_data.csv - Synthetic dataset")
    print("   • ./data/ground_truth.json - True parameters")
    print("   • Validation report available in validator.validation_results")
    
    return model, optimizer, val_results


def run_quick_test():
    """Run a quick test with minimal data for CI/CD."""
    print("Running quick MMM test...")
    
    generator = SyntheticMMMDataGenerator(n_weeks=26)  # 6 months
    df, ground_truth = generator.generate()
    
    model = BayesianMMM(
        ['TV', 'Radio', 'Digital', 'Social'],
        sampler_config={'draws': 100, 'tune': 100, 'chains': 2, 'cores': 2}
    )
    
    model.fit(df, target_col='revenue')
    
    validator = MMMValidator(model, ground_truth)
    results = validator.validate_prediction_accuracy(df)
    
    print(f"✓ Test complete - MAPE: {results['mape']:.2f}%, R²: {results['r_squared']:.4f}")
    
    return results['mape'] < 15 and results['r_squared'] > 0.7


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Bayesian Media Mix Model')
    parser.add_argument('--quick', action='store_true', help='Run quick test')
    parser.add_argument('--weeks', type=int, default=104, help='Number of weeks')
    parser.add_argument('--generate-only', action='store_true', help='Only generate data')
    
    args = parser.parse_args()
    
    if args.quick:
        success = run_quick_test()
        sys.exit(0 if success else 1)
    elif args.generate_only:
        generator = SyntheticMMMDataGenerator(n_weeks=args.weeks)
        df, gt = generator.generate()
        os.makedirs('./data', exist_ok=True)
        df.to_csv('./data/demo_data.csv', index=False)
        generator.save_ground_truth('./data/ground_truth.json')
        print(f"✓ Generated {args.weeks} weeks of data")
    else:
        model, optimizer, results = run_demo(n_weeks=args.weeks)
