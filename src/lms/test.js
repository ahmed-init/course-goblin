const { loginToLms } = require("./login");
const { findCourse } = require("./courseFinder");

const MY_COURSES_URL = "https://lms.ssn.edu.in/my/courses.php";

async function testCourseFinder() {
    let browser;

    try {
        // Login
        const result = await loginToLms();

        browser = result.browser;
        const page = result.page;

        // Open My Courses
        console.log("\nOpening My Courses...");

        await page.goto(MY_COURSES_URL, {
            waitUntil: "domcontentloaded",
        });

        await page.waitForTimeout(2000);

        console.log("Current URL:", page.url());

        // Ask for course
        const readline = require("readline");

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const courseName = await new Promise((resolve) => {
            rl.question("Course name: ", (answer) => {
                rl.close();
                resolve(answer);
            });
        });

        // Find course
        const course = await findCourse(page, courseName);

        if (!course) {
            console.log("\n✗ Course not found.");
            return;
        }

        console.log("\n✓ Selected course:");
        console.log(course.name);

        console.log("\nOpening course...");

        await page.goto(course.url, {
            waitUntil: "domcontentloaded",
        });

        await page.waitForTimeout(3000);

        console.log("\n✓ Course page opened");
        console.log("URL:", page.url());
        console.log("Title:", await page.title());

        await page.waitForTimeout(30000);

    } catch (error) {
        console.error("\n✗ Error:", error.message);

    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testCourseFinder();