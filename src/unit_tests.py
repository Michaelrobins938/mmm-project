"""
Unit Tests for MMM Core Components
==================================

Validates the mathematical implementation of Adstock and Saturation.
"""

import numpy as np
import pandas as pd
import unittest
import sys
import os

# Add current dir and parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from adstock import GeometricAdstock
from saturation import HillSaturation

class TestMMMComponents(unittest.TestCase):
    
    def test_geometric_adstock(self):
        """Test that adstock decay follows geometric progression."""
        spend = np.array([100, 0, 0, 0])
        decay = 0.5
        adstock = GeometricAdstock(decay=decay)
        transformed = adstock.transform(spend)
        
        expected = np.array([100, 50, 25, 12.5])
        np.testing.assert_allclose(transformed, expected, rtol=1e-5)
        print("[PASS] Geometric Adstock: Correct decay")

    def test_hill_saturation(self):
        """Test that Hill saturation is monotonic and capped."""
        spend = np.linspace(0, 1000, 100)
        alpha = 100
        K = 500
        sat = HillSaturation(alpha=alpha, K=K)
        transformed = sat.transform(spend)
        
        # Should be monotonic
        self.assertTrue(np.all(np.diff(transformed) >= 0))
        # Should be capped by alpha (approximately)
        self.assertLess(transformed[-1], alpha)
        # Half saturation point check
        mid_val = sat.transform(np.array([K]))[0]
        # For Hill with gamma=1, it's alpha/2
        self.assertAlmostEqual(mid_val, alpha / 2, delta=1.0)
        print("[PASS] Hill Saturation: Correct curvature")

def run_tests():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestMMMComponents)
    result = unittest.TextTestRunner(verbosity=1).run(suite)
    return result.wasSuccessful()

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
