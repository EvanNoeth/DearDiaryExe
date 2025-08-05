//login/signup code
const form=document.getElementById('form');
const username_input=document.getElementById('username-input');
const email_input=document.getElementById('email-input');
const password_input=document.getElementById('password-input');
const error_message=document.getElementById('error-message');

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

function getLoginFormErrors(email, password){
    let errors= [];
    if(email ==='' || email ==null){
        errors.push('Email is required');
        email_input.parentElement.classList.add('incorrect');
    }
    if(password ==='' || password ==null){
        errors.push('Password is required');
        password_input.parentElement.classList.add('incorrect');
    }
    return errors;
}

window.addEventListener("DOMContentLoaded", () => {
    const allInputs =[username_input, email_input, password_input].filter(input => input != null);
    allInputs.forEach(input => {
        input.addEventListener('input', () => {
            if(input.parentElement.classList.contains('incorrect')){
                input.parentElement.classList.remove('incorrect');
                error_message.innerText = '';
            }
        });
    });

    if(form){
        form.addEventListener('submit', (e)=>{
            let errors=[];
            if(username_input){
                errors= getSignupFormErrors(username_input.value, email_input.value, password_input.value);
            } else {
                errors= getLoginFormErrors(email_input.value, password_input.value);
            }
            if(errors.length>0){
                e.preventDefault();
                error_message.innerText = errors.join(". ");
            }
        });
    }
    
    

    //saving date/title when press save button
    const saveBtn = document.getElementById("save");
    const titleInput = document.getElementById("title");
    const textInput = document.getElementById("textbox");
    const responseBox = document.getElementById("response");
    const entriesList = document.getElementById("entriesList");
    const dateDisplay = document.getElementById("date");

    const resetBtn = document.getElementById("reset");
    resetBtn.addEventListener("click", (e) => {
    e.preventDefault();
    titleInput.value = "";
    textInput.value = "";
    responseBox.value = ""; 
});
    
    // current date on page 
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const formattedDate = `${month}/${day}/${year}`;
    dateDisplay.textContent = formattedDate;

    saveBtn.addEventListener("click", () => {
        const title = titleInput.value.trim() || "Untitled";
        const text = textInput.value.trim();
        
    
        const entry = {
            id: entriesList.children.length,
            date: formattedDate,
            title: title,
            text: text
        };

        const newLi = document.createElement("li");
        const newLink = document.createElement("a");
        newLink.href = "#";
        newLink.textContent = `${entry.date} - ${entry.title}`;

        newLink.addEventListener("click", (e) => {
            e.preventDefault();
            titleInput.value = entry.title;
            textInput.value = entry.text;
        });

        newLi.appendChild(newLink);
        entriesList.appendChild(newLi);

        // Clear fields for next entry
        titleInput.value = "";
        textInput.value = "";
        responseBox.value = "";
    });
});


