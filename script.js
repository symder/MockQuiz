
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let answers = [];

async function loadQuestions() {
  const container = document.getElementById("quiz-container");
  const resultsDiv = document.getElementById("results");

  try {
    const res = await fetch("questions.json");

    if (!res.ok) {
      throw new Error("Could not load questions.json");
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("The question bank is empty or invalid.");
    }

    // Use every question in the question bank.
    questions = data;

    currentQuestionIndex = 0;
    score = 0;
    answers = new Array(questions.length).fill(null);

    resultsDiv.innerHTML = "";
    renderQuestion();
  } catch (error) {
    container.textContent =
      "Unable to load the quiz. Check that questions.json exists " +
      "in the same folder as script.js and contains valid JSON.";

    console.error(error);
  }
}

function addQuizStyles() {
  if (document.getElementById("quiz-dynamic-styles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "quiz-dynamic-styles";

  style.textContent = `
    .quiz-progress {
      margin-bottom: 16px;
      color: #666;
      font-size: 0.95rem;
    }

    .quiz-question {
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 20px;
    }

    .quiz-choice {
      display: block;
      padding: 12px;
      margin: 10px 0;
      border: 1px solid #ccc;
      border-radius: 8px;
      cursor: pointer;
      line-height: 1.5;
    }

    .quiz-choice:hover {
      background: #f5f5f5;
    }

    .quiz-choice input {
      margin-right: 10px;
    }

    .quiz-choice.correct {
      border-color: #218838;
      background: #e7f5e9;
    }

    .quiz-choice.incorrect {
      border-color: #c82333;
      background: #fdebec;
    }

    .quiz-choice input:disabled {
      cursor: default;
    }

    .quiz-feedback {
      margin-top: 20px;
      padding: 16px;
      border-radius: 8px;
      line-height: 1.6;
    }

    .quiz-feedback.correct {
      background: #e7f5e9;
      border-left: 5px solid #218838;
    }

    .quiz-feedback.incorrect {
      background: #fdebec;
      border-left: 5px solid #c82333;
    }

    .quiz-button {
      margin-top: 16px;
      padding: 12px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      background: #0056b3;
      color: white;
    }

    .quiz-button:hover {
      background: #003f85;
    }

    .quiz-review {
      margin: 20px 0;
      padding: 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      line-height: 1.6;
    }

    .quiz-review p {
      margin: 8px 0;
    }
  `;

  document.head.appendChild(style);
}

function hideOldSubmitButton() {
  const buttons = document.querySelectorAll("button, input[type='submit']");

  buttons.forEach((button) => {
    const label = (
      button.textContent ||
      button.value ||
      ""
    ).trim().toLowerCase();

    if (
      label === "submit quiz" ||
      label === "submit" ||
      button.id === "submit-quiz" ||
      button.id === "submit-btn"
    ) {
      button.style.display = "none";
    }
  });
}

function renderQuestion() {
  const container = document.getElementById("quiz-container");
  const resultsDiv = document.getElementById("results");

  container.innerHTML = "";
  resultsDiv.innerHTML = "";

  if (currentQuestionIndex >= questions.length) {
    showFinalResults();
    return;
  }

  const q = questions[currentQuestionIndex];

  // Progress indicator.
  const progress = document.createElement("p");
  progress.className = "quiz-progress";
  progress.textContent =
    `Question ${currentQuestionIndex + 1} of ${questions.length}`;
  container.appendChild(progress);

  // Question text.
  const questionText = document.createElement("p");
  questionText.className = "quiz-question";
  questionText.textContent = q.question;
  container.appendChild(questionText);

  // Answer choices.
  const choicesContainer = document.createElement("div");
  choicesContainer.id = "quiz-choices";

  q.choices.forEach((choice, index) => {
    const label = document.createElement("label");
    label.className = "quiz-choice";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "current-question";
    radio.value = index;

    const choiceText = document.createElement("span");
    choiceText.textContent = choice;

    label.appendChild(radio);
    label.appendChild(choiceText);
    choicesContainer.appendChild(label);

    radio.addEventListener("change", () => {
      handleAnswer(index);
    });
  });

  container.appendChild(choicesContainer);
}

function handleAnswer(selectedIndex) {
  const q = questions[currentQuestionIndex];

  // Prevent the same question from being scored more than once.
  if (answers[currentQuestionIndex] !== null) {
    return;
  }

  const isCorrect = selectedIndex === q.correctIndex;

  answers[currentQuestionIndex] = {
    selectedIndex,
    isCorrect
  };

  if (isCorrect) {
    score++;
  }

  // Lock all answer choices after the first selection.
  const radios = document.querySelectorAll(
    'input[name="current-question"]'
  );

  radios.forEach((radio) => {
    radio.disabled = true;
  });

  // Highlight the correct answer and the selected answer.
  const labels = document.querySelectorAll(".quiz-choice");

  labels.forEach((label, index) => {
    if (index === q.correctIndex) {
      label.classList.add("correct");
    }

    if (index === selectedIndex && !isCorrect) {
      label.classList.add("incorrect");
    }
  });

  // Display instant feedback.
  const container = document.getElementById("quiz-container");

  const feedbackDiv = document.createElement("div");
  feedbackDiv.className =
    `quiz-feedback ${isCorrect ? "correct" : "incorrect"}`;

  const heading = document.createElement("h3");
  heading.textContent = isCorrect ? "Correct!" : "Incorrect.";
  feedbackDiv.appendChild(heading);

  if (!isCorrect) {
    const correctAnswer = document.createElement("p");
    correctAnswer.textContent =
      `Correct answer: ${q.choices[q.correctIndex]}`;
    feedbackDiv.appendChild(correctAnswer);
  }

  if (q.feedback) {
    const explanation = document.createElement("p");
    explanation.textContent = q.feedback;
    feedbackDiv.appendChild(explanation);
  }

  container.appendChild(feedbackDiv);

  // Next Question button.
  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "quiz-button";

  nextButton.textContent =
    currentQuestionIndex === questions.length - 1
      ? "See Final Results"
      : "Next Question";

  nextButton.addEventListener("click", () => {
    currentQuestionIndex++;
    renderQuestion();
  });

  container.appendChild(nextButton);
}

function showFinalResults() {
  const container = document.getElementById("quiz-container");
  const resultsDiv = document.getElementById("results");

  container.innerHTML = "";
  resultsDiv.innerHTML = "";

  const percentage = Math.round((score / questions.length) * 100);

  const heading = document.createElement("h2");
  heading.textContent = "Quiz Complete!";
  resultsDiv.appendChild(heading);

  const scoreText = document.createElement("p");
  scoreText.textContent =
    `Your Score: ${score} / ${questions.length} (${percentage}%)`;
  resultsDiv.appendChild(scoreText);

  const reviewHeading = document.createElement("h2");
  reviewHeading.textContent = "Answer Review";
  resultsDiv.appendChild(reviewHeading);

  questions.forEach((q, index) => {
    const userAnswer = answers[index];
    const review = document.createElement("div");
    review.className = "quiz-review";

    const questionHeading = document.createElement("h3");
    questionHeading.textContent = `Question ${index + 1}: ${q.question}`;
    review.appendChild(questionHeading);

    const answerText = document.createElement("p");

    if (userAnswer === null) {
      answerText.textContent = "Not answered.";
    } else {
      const selectedChoice = q.choices[userAnswer.selectedIndex];

      answerText.textContent =
        `Your answer: ${selectedChoice} — ` +
        (userAnswer.isCorrect ? "Correct" : "Incorrect");
    }

    review.appendChild(answerText);

    const correctText = document.createElement("p");
    correctText.textContent =
      `Correct answer: ${q.choices[q.correctIndex]}`;
    review.appendChild(correctText);

    if (q.feedback) {
      const explanation = document.createElement("p");
      explanation.textContent = `Explanation: ${q.feedback}`;
      review.appendChild(explanation);
    }

    resultsDiv.appendChild(review);
  });

  // Restart button.
  const restartButton = document.createElement("button");
  restartButton.type = "button";
  restartButton.className = "quiz-button";
  restartButton.textContent = "Restart Quiz";

  restartButton.addEventListener("click", () => {
    loadQuestions();
  });

  resultsDiv.appendChild(restartButton);

  // Scroll to the results.
  resultsDiv.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Initialize the quiz.
addQuizStyles();
hideOldSubmitButton();

// Prevent a legacy form from reloading the page on submission.
const oldForm = document.querySelector("form");

if (oldForm) {
  oldForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });
}

loadQuestions();
