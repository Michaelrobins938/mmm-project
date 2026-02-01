"""
Bayesian Media Mix Model (MMM) Package

A production-ready Bayesian Media Mix Model with adstock transformation,
saturation curves, and budget optimization.
"""

from .adstock import GeometricAdstock, ChannelSpecificAdstock
from .saturation import HillSaturation, ChannelSaturation

try:
    from .bayesian_mmm import BayesianMMM
    from .optimizer import BudgetOptimizer
    from .validation import MMMValidator
except ImportError:
    # Bayesian components unavailable without PyMC/ArviZ
    BayesianMMM = None
    BudgetOptimizer = None
    MMMValidator = None

__version__ = "1.0.0"
__author__ = "MMM Team"

__all__ = [
    'GeometricAdstock',
    'ChannelSpecificAdstock',
    'HillSaturation',
    'ChannelSaturation',
    'BayesianMMM',
    'BudgetOptimizer',
    'SyntheticMMMDataGenerator',
    'MMMValidator'
]