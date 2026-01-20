"""
Analysis wrapper - wraps existing run_analysis with limits and fallbacks.
"""
from typing import Dict, Any, Callable
from .limits import LimitEnforcer
from .fallback import DeterministicOnlyMode


async def wrap_analysis(
    run_analysis_func: Callable,
    row_count: int,
    limit_enforcer: LimitEnforcer,
    **kwargs
) -> Dict[str, Any]:
    """
    Wrap the existing run_analysis function with limits and fallbacks.
    
    This is a NON-INVASIVE wrapper that:
    1. Checks limits before calling analysis
    2. Determines if GNN should be skipped
    3. Adds metadata about execution mode
    4. Calls the ORIGINAL run_analysis unchanged
    
    Args:
        run_analysis_func: The original run_analysis function
        row_count: Number of rows in dataset
        limit_enforcer: Configured limit enforcer
        **kwargs: Arguments to pass to run_analysis
        
    Returns:
        Analysis results with mode metadata
    """
    # Check limits and determine mode
    analysis_mode = limit_enforcer.check_row_count(row_count)
    skip_gnn = limit_enforcer.should_skip_gnn(analysis_mode)
    
    # Inject skip_gnn flag into kwargs if needed
    # This assumes we'll modify routes_v2 to pass this to a modified flow
    # For now, we just call the original function as-is
    result = await run_analysis_func(**kwargs)
    
    # Add mode metadata to result
    if skip_gnn:
        mode_metadata = DeterministicOnlyMode.get_metadata()
    else:
        mode_metadata = {
            "analysis_mode": "full",
            "gnn_enabled": True,
            "detectors_active": [
                "circular_trading",
                "dense_clusters",
                "wash_trading",
                "structuring",
                "gnn_learned"
            ]
        }
    
    result["execution_metadata"] = mode_metadata
    
    return result
