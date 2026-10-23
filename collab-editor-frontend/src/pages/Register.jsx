import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";

function Register() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage("Passwords do not match");
            return;
        }

        try {

            await registerUser({
                name: name,
                email: email,
                password: password
            });

            setMessage("Registration successful");

            setTimeout(() => {
                navigate("/login");
            }, 1000);

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

            {/* Register */}
            <div className="container d-flex justify-content-center align-items-center py-5">

                <div className="card shadow-sm border-0"
                     style={{ width: "400px" }}>

                    <div className="card-body p-4">

                        <h3 className="text-center fw-bold mb-1">
                            CollabNote: Register
                        </h3>

                        <p className="text-center text-muted mb-4">
                            Create your account
                        </p>

                        <form onSubmit={handleRegister}>

                            {/* Name */}
                            <div className="mb-3">
                                <label className="form-label fw-semibold">
                                    Name
                                </label>

                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-person"></i>
                                    </span>

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. Aishwarya"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>

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
                                        placeholder="aishwarya@example.com"
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

                            {/* Confirm Password */}
                            <div className="mb-3">
                                <label className="form-label fw-semibold">
                                    Confirm Password
                                </label>

                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-key-fill"></i>
                                    </span>

                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Confirm password"
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            {/* Register */}
                            <button
                                type="submit"
                                className="btn btn-primary w-100 fw-semibold"
                            >
                                Register
                            </button>

                        </form>

                        {message && (
                            <div className="alert alert-info mt-3 mb-0">
                                {message}
                            </div>
                        )}

                        {/* Login */}
                        <div className="text-center mt-3">
                            <span className="text-muted">
                                Already have an account?
                            </span>{" "}
                            <Link
                                to="/login"
                                className="text-decoration-none fw-semibold"
                            >
                                Login
                            </Link>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}

export default Register;