const form=document.getElementById('form');
const username_input=document.getElementById('username-input');
const email_input=document.getElementById('email-input');
const password_input=document.getElementById('password-input');
const error_message=document.getElementById('error-message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let errors = [];
    
    //determine whether we are in the login or the signup page to check for errors
    if (email_input) {
        errors = getSignupFormErrors(username_input.value, email_input.value, password_input.value); //if theres an email section it must be the signup
    } else {
        errors = getLoginFormErrors(username_input.value, password_input.value);
    }

    if (errors.length > 0) {
        error_message.innerText = errors.join(". ");
        return;
    }

    const payload = {
        username: username_input.value,
        password: password_input.value
    };
    if (email_input) {
        payload.email = email_input.value;
    }

    try {
        const API_BASE = "https://deardiaryexe.onrender.com"
        const endpoint = email_input 
            ? `${API_BASE}/signup` 
            : `${API_BASE}/login`;

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            error_message.innerText = result.error || "Something went wrong";
        } else {
            alert(result.message);
            window.location.href = "/DearDiaryExe/diary.html"; //redirect to diary
        }
    } catch (err) {
        console.error(err);
        error_message.innerText = "Network error. Try again later.";
    }
});

function getLoginFormErrors(username, password){
    let errors= [];
    if(username ==='' || username ==null){
        username_input.parentElement.classList.add('incorrect');
    }
    if(password ==='' || password ==null){
        errors.push('Password is required');
        password_input.parentElement.classList.add('incorrect');
    }
    return errors;
}

function getSignupFormErrors(username, email, password){
    let errors=[];
    if(username ==='' || username ==null){
        username_input.parentElement.classList.add('incorrect');
    }
    if(email ==='' || email ==null){
        email_input.parentElement.classList.add('incorrect');
    }
    if(password ==='' || password ==null){
        password_input.parentElement.classList.add('incorrect');
    }
    if(password.length < 8){
        errors.push('Password must have at least 8 characters');
        password_input.parentElement.classList.add('incorrect');
    }
    return errors;
}

const allInputs =[username_input, email_input, password_input].filter(input => input != null);
allInputs.forEach(input => {
    input.addEventListener('input', () => {
        if(input.parentElement.classList.contains('incorrect')){
            input.parentElement.classList.remove('incorrect');
            error_message.innerText = '';
        }
    });
});