# Bayesian Media Mix Modeling (MMM): Axiomatic Budget Optimization
## Integrating Non-Linear Saturation, Temporal Adstock Decay, and Bayesian Posterior Inference

**Technical Whitepaper v1.0.0**

| **Attribute** | **Value** |
|---|---|
| **Version** | 1.0.0 |
| **Status** | Production-Ready |
| **Date** | January 31, 2026 |
| **Classification** | Strategic Marketing Science |
| **Document Type** | Technical Whitepaper |

---

## **Abstract**

Media Mix Modeling (MMM) has traditionally relied on frequentist OLS regressions that struggle with the non-linearities and temporal dependencies of modern marketing. This paper specifies a high-fidelity **Bayesian MMM Framework** designed for the Marketing CFO. The framework decomposes complex sales drivers into baseline, seasonal, and marketing-driven components. 

We integrate:
- **Geometric and Weibull Adstock** to model carryover effects (memory).
- **Hill Functions** to capture diminishing returns and saturation plateaus.
- **No-U-Turn Sampler (NUTS)** for hierarchical Bayesian inference, providing full posterior distributions for ROI.
- **Convex Budget Optimization** to solve the "optimal spend" problem under saturated conditions.

---

## **Table of Contents**

1. [Glossary & Notation](#glossary--notation)
2. [The Core MMM Problem](#1-the-core-mmm-problem)
3. [Temporal Dynamics: Adstock Decay](#2-temporal-dynamics-adstock-decay)
4. [Diminishing Returns: Saturation Functions](#3-diminishing-returns-saturation-functions)
5. [Bayesian Hierarchy & Posterior Inference](#4-bayesian-hierarchy--posterior-inference)
6. [Optimal Budget Allocation](#5-optimal-budget-allocation)
7. [Validation & Diagnostic Rigor](#6-validation--diagnostic-rigor)
8. [Causal Interpretation & Limitations](#7-causal-interpretation--limitations)
9. [Conclusion](#8-conclusion)
10. [Appendices](#appendices)

---

## **Glossary & Notation**

| **Term** | **Definition** |
|---|---|
| **Adstock** | The carryover effect of marketing where past spend influences current sales. |
| **Saturation** | The phenomenon where incremental spend leads to decreasing marginal returns (diminishing returns). |
| **Hill Function** | A non-linear curve used to model saturation, characterized by an 'S' shape. |
| **Baseline** | Sales that occur in the absence of marketing activity (organic demand). |
| **MCMC (NUTS)** | Markov Chain Monte Carlo sampling used to estimate Bayesian posteriors. |
| **iROAS** | Incremental Return on Ad Spend; the marginal dollar returned per dollar spent. |

---

## **1. The Core MMM Problem**

Attribution at the user level is increasingly blinded by privacy regulations (GDPR, ATT). MMM provides a privacy-first alternative by modeling aggregated time-series data. The objective is to decompose total sales $Y_t$:

$$Y_t = \text{Baseline} + \text{Seasonality}_t + \sum_{k=1}^K \beta_k \cdot f(\text{Spend}_{k,t}) + \epsilon_t$$

Where $f(\cdot)$ is a non-linear transformation accounting for time-lag and saturation.

---

## **2. Temporal Dynamics: Adstock Decay**

Marketing effects do not vanish instantly. We use **Geometric Adstock** to capture the "half-life" of an ad's influence:

$$A_{t} = X_t + \theta \cdot A_{t-1}$$

Where $\theta \in [0, 1)$ is the decay rate. This models the "memory" of the marketing channel. For more complex decay patterns (e.g., delayed peak), we support **Weibull Adstock**.

---

## **3. Diminishing Returns: Saturation Functions**

Spending more does not always result in linear growth. We implement the **Hill Function** to model this:

$$S_t = \frac{x_t^n}{\kappa^n + x_t^n}$$

- **$\kappa$ (Half-saturation):** The spend level where 50% of maximum effectiveness is reached.
- **$n$ (Shape):** Controls the "steepness" of the curve (S-shape vs. concave).

This allows the model to identify "saturation plateaus" where additional spend is wasted.

---

## **4. Bayesian Hierarchy & Posterior Inference**

We specify the model in a Bayesian framework to incorporate prior knowledge and quantify uncertainty.

### **4.1 Priors**
- **$\beta_k \sim \text{HalfNormal}(\sigma=5)$**: Enforces positive ROI (marketing shouldn't negatively impact sales).
- **$\theta \sim \text{Beta}(\alpha=2, \beta=2)$**: Centered decay prior.

### **4.2 The Posterior**
Using Hamiltonian Monte Carlo (HMC), we sample from the posterior $P(\Theta | \text{Data})$, providing not just a point estimate, but a **95% Credible Interval** for every channel's contribution.

---

## **5. Optimal Budget Allocation**

The ultimate application is the **Optimizer**. We solve the following constrained optimization problem:

$$\text{Maximize } \sum_{k=1}^K \text{Sales}_k(\text{Spend}_k) \quad \text{subject to } \sum \text{Spend}_k = \text{Total Budget}$$

By calculating the **marginal iROAS** for every channel, the optimizer shifts budget from saturated channels (low marginal return) to under-invested channels (high marginal return) until equilibrium is reached.

---

## **6. Validation & Diagnostic Rigor**

Every production model must pass the **Validation Suite**:
- **MAPE (Mean Absolute Percentage Error):** Target < 10%.
- **Hold-out Accuracy:** Performance on the last 4-8 weeks of unseen data.
- **R-Hat Convergence:** Ensures Bayesian chains have stabilized ($R\text{-hat} < 1.05$).
- **Divergence Check:** Zero divergent transitions during sampling.

---

## **7. Causal Interpretation & Limitations**

> ⚠️ **CAUTION:** MMM correlates spend and sales. It does not control for all external confounders.
- **Endogeneity:** High sales might cause higher budgets (reverse causality).
- **Collinearity:** Different channels (TV and Search) often move in sync, making it difficult to separate their effects.
- **Resolution:** Weekly granularity limits the ability to see short-term (daily/hourly) spikes.

---

## **8. Conclusion**

The Bayesian MMM framework transforms marketing from a "cost center" into a "predictable investment engine." By moving away from rule-based attribution and toward axiomatic, non-linear modeling, organizations can achieve a "single source of truth" for cross-channel budget decisions.

---

## **Appendices**

### **Appendix A: Code Specification (Python/PyMC)**
The reference implementation uses a modular architecture:
- `adstock_transformation()`
- `hill_saturation()`
- `run_inference()`

### **Appendix B: References**
[1] Jin, Y., et al. (2017). "Bayesian Methods for Media Mix Modeling with Carryover and Shape Effects." Google Research.
[2] Chan, D., & Perry, S. (2017). "Challenges and Opportunities in Media Mix Modeling." Journal of Marketing Analytics.
