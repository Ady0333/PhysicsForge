# physicsforge-backend/src/solvers/fem_solver.jl

using Gridap
using LinearAlgebra
using SparseArrays

# NO module imports needed - everything is included in parent PhysicsForge module

mutable struct HeatSolver
    U::TrialFESpace
    V::TestFESpace
    uh::FEFunction
    A::SparseMatrixCSC{Float64, Int}
    M::SparseMatrixCSC{Float64, Int}
    α::Float64
    Δt::Float64
    t::Float64
end

function HeatSolver(;nx=50, ny=50, diffusivity=0.1, dt=0.01)
    # Get model and spaces using functions from heat.jl
    # (which is already included in parent module)
    model = create_mesh(nx, ny)
    U, V = create_fe_spaces(model)
    
    # Initial condition
    uh = interpolate(x -> 0.0, U)
    
    # Build matrices using heat.jl functions
    A, M = build_matrices(U, V, diffusivity, dt)
    
    HeatSolver(U, V, uh, A, M, diffusivity, dt, 0.0)
end

function step!(solver::HeatSolver)
    # Implicit Euler step
    rhs = solver.M * get_free_dof_values(solver.uh)
    
    # Solve system
    u_new = solver.A \ rhs
    
    # Update FE function
    solver.uh = FEFunction(solver.U, u_new)
    solver.t += solver.Δt
    
    return solver.uh
end

function add_heat_source!(solver::HeatSolver, x::Float64, y::Float64, magnitude::Float64)
    # Add Gaussian heat source at (x,y)
    dofs = get_free_dof_values(solver.uh)
    
    # This is a simplified version - proper implementation would
    # evaluate at quadrature points
    dofs .+= magnitude * exp(-((0.5-x)^2 + (0.5-y)^2) / 0.01)
    
    solver.uh = FEFunction(solver.U, dofs)
end

function to_grid(uh::FEFunction, nx::Int, ny::Int)
    # Evaluate on regular grid
    xs = range(0, 1, length=nx)
    ys = range(0, 1, length=ny)
    
    grid = zeros(Float64, ny, nx)
    
    for (j, y) in enumerate(ys)
        for (i, x) in enumerate(xs)
            point = VectorValue(x, y)
            try
                grid[j, i] = uh(point)
            catch
                grid[j, i] = 0.0
            end
        end
    end
    
    return grid
end