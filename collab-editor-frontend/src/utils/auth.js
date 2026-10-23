export function getLoggedInUser() {

    const token = localStorage.getItem("token");

    if (!token) {
        return null;
    }

    try {

        const payload = JSON.parse(
            atob(token.split(".")[1])
        );

        return {
            userId: payload.userId,
            email: payload.sub
        };

    } catch (error) {

        console.error("Invalid token");

        return null;
    }
}


export function logout() {

    localStorage.removeItem("token");

    window.location.href = "/login";
}