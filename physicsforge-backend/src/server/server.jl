# src/server/server.jl
using HTTP
using JSON3
using LinearAlgebra

include("../solvers/fem_solver.jl")
include("../physics/heat.jl")

# Shared solver state
mutable struct SimulationState
    solver::Union{Nothing, HeatSolver}
    params::Dict{String, Float64}
end

const sim_state = SimulationState(nothing, Dict())

function handle_websocket(ws)
    println("WebSocket client connected")
    
    while !eof(ws)
        try
            msg = String(readavailable(ws))
            if isempty(msg)
                continue
            end
            
            data = JSON3.read(msg)
            
            if data.type == "INIT"
                # Initialize solver
                sim_state.solver = HeatSolver(
                    nx=50, ny=50,
                    diffusivity=get(data, :diffusivity, 0.1),
                    dt=get(data, :timeStep, 0.01)
                )
                
                response = JSON3.write(Dict(
                    "type" => "STATUS",
                    "message" => "Solver initialized"
                ))
                write(ws, response)
                
            elseif data.type == "STEP"
                # Run one timestep
                if !isnothing(sim_state.solver)
                    t = time()
                    solution = step!(sim_state.solver)
                    solve_time = (time() - t) * 1000  # ms
                    
                    # Convert to grid for visualization
                    grid = to_grid(solution, 50, 50)
                    
                    response = JSON3.write(Dict(
                        "type" => "SOLUTION_UPDATE",
                        "data" => Dict(
                            "values" => vec(grid),
                            "solveTime" => solve_time
                        )
                    ))
                    write(ws, response)
                end
                
            elseif data.type == "UPDATE_PARAMS"
                # Update parameters
                if haskey(data, :diffusivity)
                    sim_state.params["diffusivity"] = data.diffusivity
                end
                
            elseif data.type == "ADD_DISTURBANCE"
                # Add heat source
                if !isnothing(sim_state.solver)
                    add_heat_source!(
                        sim_state.solver,
                        data.position.x,
                        data.position.y,
                        get(data, :magnitude, 1.0)
                    )
                end
            end
            
        catch e
            @warn "WebSocket error" exception=(e, catch_backtrace())
            break
        end
    end
    
    println("WebSocket client disconnected")
end

function start_server(port=8000)
    @info "Starting PhysicsForge backend on port $port"
    
    HTTP.listen("0.0.0.0", port) do http
        if HTTP.WebSockets.is_upgrade(http.message)
            HTTP.WebSockets.upgrade(http) do ws
                handle_websocket(ws)
            end
        else
            HTTP.setstatus(http, 404)
            HTTP.startwrite(http)
            write(http, "PhysicsForge WebSocket Server")
        end
    end
end