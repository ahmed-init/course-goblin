const { chromium } = require("playwright");
const readline = require("readline");

const LMS_LOGIN_URL = "https://lms.ssn.edu.in/login/index.php";

function askQuestion(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function loginToLms() {
    const digitalId = await askQuestion("SSN Digital ID: ");
    const password = await askQuestion("SSN Password: ");

    const browser = await chromium.launch({
        headless: false,
    });

    const page = await browser.newPage();

    console.log("\nOpening SSN LMS...");

    await page.goto(LMS_LOGIN_URL, {
        waitUntil: "domcontentloaded",
    });

    await page.locator('input[name="username"]').fill(digitalId);
    await page.locator('input[name="password"]').fill(password);

    console.log("✓ Credentials entered.");

    await page.locator('button[type="submit"]').click();

    // Give Moodle time to complete its redirects/session setup.
    await page.waitForTimeout(5000);

    console.log("Current URL:", page.url());
    console.log("Page title:", await page.title());

    // Check whether Moodle left us on the login page.
    if (page.url().includes("/login/")) {
        const pageText = await page.locator("body").innerText();

        if (pageText.toLowerCase().includes("session")) {
            throw new Error(
                "Moodle reported a session problem during login."
            );
        }

        throw new Error(
            "Login did not complete. Moodle is still on the login page."
        );
    }

    console.log("✓ Login successful!");

    return {
        browser,
        page,
    };
}

module.exports = {
    loginToLms,
};