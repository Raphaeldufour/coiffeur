const emailContainer = document.getElementById("login-input");
const passwordContainer = document.getElementById("password-input");
const loginButton = document.getElementById("login-submit");
const cancelButton = document.getElementById("cancel-button");
cancelButton.addEventListener("click", (click) => {
    localStorage.setItem('isLoggedIn', 'false');
    click.preventDefault();
    window.location.href = "http://localhost:3000";
});

loginButton.addEventListener("click", handleLoginFormSubmission);
async function checkLoginAndPassword(data) {
        const response = await fetch('http://localhost:3000/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response;
}
async function handleLoginFormSubmission(click) {
    click.preventDefault(); //Comme c'est un submit c'est pour empêcher le comportement par défaut (qui est de recharger la page)
    const email = emailContainer.value;
    const password = passwordContainer.value;
    const data = {
        email: email,
        password: password
    };
    const response = await checkLoginAndPassword(data);
    if (response.ok) {
        const responseData = await response.json();
        localStorage.setItem('token', responseData.token);
        localStorage.setItem('isLoggedIn', 'true');
        window.location.href = "http://localhost:3000";
    } else {
        const error = await response.json();
        alert(error.message);
    }
}
