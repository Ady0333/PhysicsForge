using JSON3
using HTTP

include("../physics/heat.jl");       using .HeatPhysics
include("../solvers/fem_solver.jl"); using .FEMSolver
include("websocket.jl");             using .WSServer

function ws_handler(ws::HTTP.WebSockets.WebSocket)
    println("[WS] Client connected")

    try
        for msg_raw in ws
            msg  = JSON3.read(String(msg_raw))
            type = get(msg, :type, "")
            println("[WS] Received: ", type)

            if type == "init"
                α  = Float64(get(msg, :alpha, 0.1))
                n  = Int(get(msg, :resolution, 32))
                dt = Float64(get(msg, :dt, 0.01))
                WSServer.solver_ref[] = FEMSolver.HeatSolver(α=α, n=n, dt=dt)
                HTTP.WebSockets.send(ws, JSON3.write(Dict("type" => "ready")))
                println("[WS] Solver initialized, sent ready")

            elseif type == "step"
                solver = WSServer.solver_ref[]
                isnothing(solver) && continue
                u_new, ms = FEMSolver.step!(solver)
                grid = FEMSolver.to_grid(solver)
                payload = Dict(
                    "type"    => "frame",
                    "step"    => solver.step,
                    "time"    => solver.t,
                    "solveMs" => ms,
                    "grid"    => vec(grid),
                    "n"       => solver.prob.n,
                )
                HTTP.WebSockets.send(ws, JSON3.write(payload))

            elseif type == "reset"
                WSServer.init_solver!()
                HTTP.WebSockets.send(ws, JSON3.write(Dict("type" => "ready")))
            end
        end
    catch e
        println("[WS] Error: ", e)
    end

    println("[WS] Client disconnected")
end

println("Starting PhysicsForge server on port 8080...")
HTTP.WebSockets.listen("0.0.0.0", 8080) do ws
    ws_handler(ws)
end