# physicsforge-backend/src/main.jl

using Pkg
Pkg.activate(@__DIR__)

# Include the main module
include("PhysicsForge.jl")

using .PhysicsForge

# Start the server
start_server(8000)