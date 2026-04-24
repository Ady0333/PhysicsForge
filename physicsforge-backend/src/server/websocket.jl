module WSServer

using Genie, Genie.Router, Genie.WebChannels
using JSON3
using ..FEMSolver

# Global solver instance (reset on client request)
solver_ref = Ref{Union{HeatSolver, Nothing}}(nothing)

function init_solver!(params=Dict())
    α  = get(params, "alpha",      0.1)
    n  = get(params, "resolution", 32)
    dt = get(params, "dt",         0.01)
    solver_ref[] = HeatSolver(α=α, n=n, dt=dt)
end

function handle_message(client, msg_raw)
    msg = JSON3.read(msg_raw)
    type = get(msg, :type, "")

    if type == "init"
        init_solver!(Dict(string(k) => v for (k,v) in pairs(msg)))
        WebChannels.transmit(client, JSON3.write(Dict("type" => "ready")))

    elseif type == "step"
        solver = solver_ref[]
        isnothing(solver) && return
        u_new, ms = step!(solver)
        grid = to_grid(solver)
        payload = Dict(
            "type"     => "frame",
            "step"     => solver.step,
            "time"     => solver.t,
            "solveMs"  => ms,
            "grid"     => vec(grid),   # flat array, n*n floats in [0,1]
            "n"        => solver.prob.n,
        )
        WebChannels.transmit(client, JSON3.write(payload))

    elseif type == "reset"
        init_solver!()
        WebChannels.transmit(client, JSON3.write(Dict("type" => "ready")))
    end
end

export init_solver!, handle_message

end