module FEMSolver

using Gridap
using LinearAlgebra
using ..HeatPhysics

mutable struct HeatSolver
    prob::HeatProblem
    U
    V
    A          # system matrix (M + dt·K)
    M          # mass matrix
    u_h        # current FE solution
    t::Float64 # current time
    step::Int
end

function HeatSolver(; α=0.1, n=32, dt=0.01)
    prob  = HeatProblem(α, n, dt)
    model = make_model(prob)
    U, V  = make_spaces(model)
    A, M, _ = build_matrices(U, V, prob)
    u0    = initial_condition(U, prob)
    HeatSolver(prob, U, V, A, M, u0, 0.0, 0)
end

"""
Advance one time step. Returns the new solution as a flat Float64 vector.
"""
function step!(solver::HeatSolver)
    t0 = time_ns()

    # RHS: M · u^n
    b = get_free_dof_values(solver.u_h)
    rhs = solver.M * b

    # Solve (M + dt·K) u^{n+1} = rhs
    u_new = solver.A \ rhs

    # Update state
    set_free_dof_values!(solver.u_h, u_new)
    solver.t    += solver.prob.dt
    solver.step += 1

    elapsed_ms = (time_ns() - t0) / 1e6

    return u_new, elapsed_ms
end

"""
Extract solution as a normalized n×n matrix for visualization.
"""
function to_grid(solver::HeatSolver)
    vals = get_free_dof_values(solver.u_h)
    n    = solver.prob.n
    # Reshape to 2D grid (Gridap DOFs are row-major on CartesianModel)
    grid = reshape(vals[1:n*n], n, n)
    mn, mx = minimum(grid), maximum(grid)
    mx > mn ? (grid .- mn) ./ (mx - mn) : grid
end

export HeatSolver, step!, to_grid

end