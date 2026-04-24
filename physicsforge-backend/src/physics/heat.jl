module HeatPhysics

using Gridap

"""
Heat equation: ∂u/∂t = α∇²u
Discretized with FEM on a unit square domain.
"""
struct HeatProblem
    α::Float64        # thermal diffusivity
    n::Int            # grid resolution (n×n)
    dt::Float64       # time step
end

function make_model(prob::HeatProblem)
    domain = (0, 1, 0, 1)
    partition = (prob.n, prob.n)
    model = CartesianDiscreteModel(domain, partition)
    return model
end

function make_spaces(model)
    reffe = ReferenceFE(lagrangian, Float64, 1)
    V = TestFESpace(model, reffe, conformity=:H1, dirichlet_tags="boundary")
    U = TrialFESpace(V, 0.0)   # u = 0 on boundary
    return U, V
end

function initial_condition(U, prob::HeatProblem)
    # Gaussian hot spot at center
    u0(x) = exp(-50 * ((x[1] - 0.5)^2 + (x[2] - 0.5)^2))
    return interpolate_everywhere(u0, U)
end

function build_matrices(U, V, prob::HeatProblem)
    Ω  = Triangulation(U.space.model)
    dΩ = Measure(Ω, 2)

    α  = prob.α
    dt = prob.dt

    # Mass matrix: ∫ u·v dΩ
    a_mass(u, v) = ∫(u * v) * dΩ
    # Stiffness matrix: α·∫ ∇u·∇v dΩ
    a_stiff(u, v) = ∫(α * ∇(u) ⊙ ∇(v)) * dΩ

    # Implicit Euler: (M + dt·K)u^{n+1} = M·u^n
    a(u, v) = a_mass(u, v) + dt * a_stiff(u, v)

    A = assemble_matrix(a, U, V)
    M = assemble_matrix(a_mass, U, V)

    return A, M, dΩ
end

export HeatProblem, make_model, make_spaces, initial_condition, build_matrices

end
