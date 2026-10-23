import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const result = await loginUser({
                email: email,
                password: password
            });

            localStorage.setItem("token", result.token);

            setMessage("Login successful");

            navigate("/dashboard");

        } catch (error) {
            setMessage(error.message);
        }
    };

    return (
        <div className="min-vh-100 bg-light">

            {/* Header */}
            <div className="bg-primary text-white py-3 shadow-sm">
                <div className="container">
                    <h2 className="mb-0 fw-bold">
                        <i className="bi bi-file-earmark-text me-2"></i>
                        CollabNote
                    </h2>
                </div>
            </div>

            {/* Login */}
            <div className="container d-flex justify-content-center align-items-center"
                 style={{ minHeight: "calc(100vh - 72px)" }}>

                <div className="card shadow-sm border-0"
                     style={{ width: "400px" }}>

                    <div className="card-body p-4">

                        <h3 className="text-center fw-bold mb-1">
                            CollabNote: Login
                        </h3>

                        <p className="text-center text-muted mb-4">
                            Welcome Back
                        </p>

                        <form onSubmit={handleLogin}>

                            {/* Email */}
                            <div className="mb-3">
                                <label className="form-label fw-semibold">
                                    Email
                                </label>

                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-envelope"></i>
                                    </span>

                                    <input
                                        type="email"
                                        className="form-control"
                                        placeholder="user@example.com"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="mb-3">
                                <label className="form-label fw-semibold">
                                    Password
                                </label>

                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-key"></i>
                                    </span>

                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            {/* Login button */}
                            <button
                                type="submit"
                                className="btn btn-primary w-100 fw-semibold"
                            >
                                Login
                            </button>

                        </form>

                        {message && (
                            <div className="alert alert-info mt-3 mb-0">
                                {message}
                            </div>
                        )}

                        {/* Register */}
                        <div className="text-center mt-3">
                            <span className="text-muted">
                                Don't have an account?
                            </span>{" "}
                            <Link
                                to="/register"
                                className="text-decoration-none fw-semibold"
                            >
                                Register
                            </Link>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}

export default Login;