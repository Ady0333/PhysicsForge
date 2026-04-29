module PhysicsForge

using Gridap
using LinearAlgebra
using SparseArrays
using HTTP
using JSON3

# Include physics modules first
include("physics/heat.jl")
include("physics/wave.jl")
include("physics/navier_stokes.jl")

# Include solvers (they can now reference physics functions)
include("solvers/fem_solver.jl")
include("solvers/neural_solver.jl")

# Include neural operators
include("neural/deeponet.jl")
include("neural/fno.jl")

# Include server
include("server/routes.jl")
include("server/server.jl")

# Export main types and functions
export HeatSolver, WaveSolver
export step!, add_heat_source!, to_grid
export start_server

end # module PhysicsForge