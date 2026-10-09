
// ============================================
// STUDENT REGISTRATION & RESULT MANAGEMENT
// ============================================

// The key under which all student records are saved.
const STORAGE_KEY = "studentResultManagementRecords";

// Maximum marks for five subjects.
const MAX_TOTAL = 500;

// Minimum marks required in EACH subject to pass.
const PASS_MARKS = 35;

// Keep track of the most recently registered student.
let currentStudent = null;

// Get the HTML elements we need to work with.
const studentForm = document.getElementById("studentForm");
const formMessage = document.getElementById("formMessage");
const resultSection = document.getElementById("resultSection");
const jsonOutput = document.getElementById("jsonOutput");
const studentTableBody = document.getElementById("studentTableBody");
const emptyMessage = document.getElementById("emptyMessage");
const clearAllButton = document.getElementById("clearAll");
const downloadJsonButton = document.getElementById("downloadJson");

// The IDs of the five subject input fields.
const subjectIds = [
    "english",
    "maths",
    "science",
    "computer",
    "history"
];


// ============================================
// 1. READ STUDENTS FROM LOCAL STORAGE
// ============================================

function getStudents() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        // If nothing has been saved, return an empty array.
        if (savedData === null) {
            return [];
        }

        const students = JSON.parse(savedData);

        // Check that the saved data is an array.
        if (!Array.isArray(students)) {
            throw new Error("Saved student data is invalid.");
        }

        return students;
    } catch (error) {
        console.error("Could not read student records:", error);

        throw new Error(
            "Unable to read saved records. Your saved data may be invalid."
        );
    }
}


// ============================================
// 2. SAVE STUDENTS TO LOCAL STORAGE
// ============================================

function saveStudents(students) {
    // Convert the complete student array into a JSON string.
    const jsonString = JSON.stringify(students);

    // Save that JSON string in the browser.
    localStorage.setItem(STORAGE_KEY, jsonString);
}


// ============================================
// 3. DISPLAY SUCCESS OR ERROR MESSAGES
// ============================================

function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = "message " + type;
}


// ============================================
// 4. CALCULATE TOTAL, PERCENTAGE, PASS OR FAIL
// ============================================

function calculateResult(marks) {
    // Add all five subject marks.
    const total = marks.english
        + marks.maths
        + marks.science
        + marks.computer
        + marks.history;

    // Calculate the percentage out of 500.
    const percentage = (total / MAX_TOTAL) * 100;

    // A student must pass every subject.
    const passedEverySubject = Object.values(marks)
        .every(mark => mark >= PASS_MARKS);

    const status = passedEverySubject ? "Pass" : "Fail";

    // Return all calculated values in an object.
    return {
        total: total,
        percentage: Number(percentage.toFixed(2)),
        status: status
    };
}


// ============================================
// 5. GET THE LATEST STUDENT FORM DATA
// ============================================

function getStudentFormData() {
    // Read the text fields and remove extra spaces.
    const name = document.getElementById("name")
        .value.trim();

    const roll = document.getElementById("roll")
        .value.trim();

    const studentClass = document.getElementById("studentClass")
        .value.trim();

    const email = document.getElementById("email")
        .value.trim();

    // Read the marks from all five subject inputs.
    const marks = {};

    subjectIds.forEach(subjectId => {
        marks[subjectId] = Number(
            document.getElementById(subjectId).value
        );
    });

    return {
        name: name,
        roll: roll,
        studentClass: studentClass,
        email: email,
        marks: marks
    };
}


// ============================================
// 6. VALIDATE THE STUDENT DATA
// ============================================

function validateStudent(student, existingStudents) {
    // Check that required text fields are not empty.
    if (
        !student.name ||
        !student.roll ||
        !student.studentClass ||
        !student.email
    ) {
        return "Please fill in all student details.";
    }

    // Do not allow the same roll number twice.
    const duplicateRoll = existingStudents.some(
        existingStudent =>
            existingStudent.roll.toLowerCase() ===
            student.roll.toLowerCase()
    );

    if (duplicateRoll) {
        return "This roll number is already registered.";
    }

    // Check every subject mark.
    for (const subjectId of subjectIds) {
        const mark = student.marks[subjectId];

        if (!Number.isInteger(mark) || mark < 0 || mark > 100) {
            return "Every subject mark must be a whole number from 0 to 100.";
        }
    }

    // No validation errors were found.
    return null;
}


// ============================================
// 7. DISPLAY THE LATEST RESULT
// ============================================

function displayResult(student) {
    // Show the result section.
    resultSection.hidden = false;

    // Use textContent so student input is displayed as text.
    document.getElementById("resultName").textContent =
        student.name;

    document.getElementById("resultRoll").textContent =
        student.roll;

    document.getElementById("resultTotal").textContent =
        student.total + " / " + MAX_TOTAL;

    document.getElementById("resultPercentage").textContent =
        student.percentage.toFixed(2) + "%";

    const statusElement = document.getElementById("resultStatus");

    statusElement.textContent = student.status;

    // Green for Pass, red for Fail.
    statusElement.className =
        student.status === "Pass" ? "pass" : "fail";

    // Convert the student object to a readable JSON string.
    const studentJSON = JSON.stringify(student, null, 2);

    // Display the JSON on the webpage.
    jsonOutput.textContent = studentJSON;
}


// ============================================
// 8. DISPLAY ALL STUDENTS IN THE TABLE
// ============================================

function renderStudents() {
    let students;

    try {
        students = getStudents();
    } catch (error) {
        showMessage(error.message, "error");
        return;
    }

    // Remove old table rows before rebuilding the table.
    studentTableBody.replaceChildren();

    // Show a message if there are no student records.
    emptyMessage.hidden = students.length > 0;

    // Create a row for every saved student.
    students.forEach(student => {
        const row = document.createElement("tr");

        // Helper function for safely creating table cells.
        function createCell(value) {
            const cell = document.createElement("td");
            cell.textContent = String(value);
            return cell;
        }

        row.appendChild(createCell(student.roll));
        row.appendChild(createCell(student.name));
        row.appendChild(createCell(student.studentClass));

        row.appendChild(
            createCell(student.total + " / " + MAX_TOTAL)
        );

        row.appendChild(
            createCell(student.percentage.toFixed(2) + "%")
        );

        const statusCell = createCell(student.status);

        // Color the result in the table.
        statusCell.classList.add(
            student.status === "Pass" ? "pass" : "fail"
        );

        row.appendChild(statusCell);

        // Create a delete button for this student.
        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "small-delete";
        deleteButton.setAttribute(
            "aria-label",
            "Delete student " + student.roll
        );

        // Store the roll number on the button.
        deleteButton.dataset.roll = student.roll;

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        studentTableBody.appendChild(row);
    });
}


// ============================================
// 9. REGISTER A STUDENT WHEN FORM IS SUBMITTED
// ============================================

studentForm.addEventListener("submit", function (event) {
    // Prevent the browser from refreshing the page.
    event.preventDefault();

    // First, apply built-in HTML validation.
    if (!studentForm.checkValidity()) {
        studentForm.reportValidity();
        return;
    }

    let existingStudents;

    try {
        existingStudents = getStudents();
    } catch (error) {
        showMessage(error.message, "error");
        return;
    }

    // Read all the information entered in the form.
    const formData = getStudentFormData();

    // Validate the data before calculating or saving.
    const validationError = validateStudent(
        formData,
        existingStudents
    );

    if (validationError) {
        showMessage(validationError, "error");
        return;
    }

    // Calculate total marks, percentage, and final status.
    const calculated = calculateResult(formData.marks);

    // Create a complete student object.
    const student = {
        name: formData.name,
        roll: formData.roll,
        studentClass: formData.studentClass,
        email: formData.email,

        // Store individual subject marks.
        marks: formData.marks,

        // Store the calculated result.
        total: calculated.total,
        maximumMarks: MAX_TOTAL,
        percentage: calculated.percentage,
        status: calculated.status,

        // Save the date and time of registration.
        registeredAt: new Date().toISOString()
    };

    // Add the new student to the existing records.
    const updatedStudents = [...existingStudents, student];

    // Save the records before showing success.
    try {
        saveStudents(updatedStudents);
    } catch (error) {
        console.error("Could not save student:", error);

        showMessage(
            "Could not save the record. Check browser storage settings.",
            "error"
        );

        return;
    }

    // Keep a reference to the latest registered student.
    currentStudent = student;

    // Update the result card and the student table.
    displayResult(student);
    renderStudents();

    // Display a helpful success message.
    showMessage(
        "Student registered successfully! Result: " + student.status,
        "success"
    );

    // Clear the form for the next student.
    studentForm.reset();

    // Bring the result section into view.
    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});


// ============================================
// 10. DELETE A STUDENT
// ============================================

studentTableBody.addEventListener("click", function (event) {
    // Check whether a Delete button was clicked.
    const button = event.target.closest("button[data-roll]");

    if (!button) {
        return;
    }

    const rollToDelete = button.dataset.roll;

    let students;

    try {
        students = getStudents();
    } catch (error) {
        showMessage(error.message, "error");
        return;
    }

    // Keep every student except the one being deleted.
    const updatedStudents = students.filter(
        student => student.roll !== rollToDelete
    );

    // Save the updated list.
    try {
        saveStudents(updatedStudents);
    } catch (error) {
        showMessage("Could not delete the student record.", "error");
        return;
    }

    // If the displayed student was deleted, clear that result.
    if (
        currentStudent &&
        currentStudent.roll === rollToDelete
    ) {
        currentStudent = null;
        resultSection.hidden = true;
    }

    // Refresh the table.
    renderStudents();

    showMessage(
        "Student " + rollToDelete + " has been deleted.",
        "success"
    );
});


// ============================================
// 11. CLEAR ALL STUDENT RECORDS
// ============================================

clearAllButton.addEventListener("click", function () {
    let students;

    try {
        students = getStudents();
    } catch (error) {
        showMessage(error.message, "error");
        return;
    }

    if (students.length === 0) {
        showMessage("There are no records to delete.", "error");
        return;
    }

    // Ask for confirmation before deleting all records.
    const confirmed = window.confirm(
        "Are you sure you want to delete ALL student records?"
    );

    if (!confirmed) {
        return;
    }

    try {
        saveStudents([]);
    } catch (error) {
        showMessage("Could not clear student records.", "error");
        return;
    }

    currentStudent = null;
    resultSection.hidden = true;

    renderStudents();

    showMessage("All student records have been deleted.", "success");
});


// ============================================
// 12. DOWNLOAD THE STUDENT OBJECT AS JSON
// ============================================

downloadJsonButton.addEventListener("click", function () {
    if (!currentStudent) {
        showMessage(
            "Register a student first to download their JSON.",
            "error"
        );
        return;
    }

    // Convert the current student object into JSON.
    const jsonString = JSON.stringify(currentStudent, null, 2);

    // Create a downloadable file in the browser.
    const blob = new Blob(
        [jsonString],
        { type: "application/json" }
    );

    const downloadURL = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadURL;
    link.download = "student-" + currentStudent.roll + ".json";

    document.body.appendChild(link);
    link.click();
    link.remove();

    // Release the temporary browser URL.
    URL.revokeObjectURL(downloadURL);
});


// ============================================
// 13. INITIALIZE THE APPLICATION
// ============================================

// Display saved records when the page first opens.
renderStudents();