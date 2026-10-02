
const { chromium } = require("playwright");
const readline = require("readline");

const LMS_LOGIN_URL = "https://lms.ssn.edu.in/login/index.php";
const MY_COURSES_URL = "https://lms.ssn.edu.in/my/courses.php";

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

async function testCourseSearch() {
    const digitalId = await askQuestion("SSN Digital ID: ");
    const password = await askQuestion("SSN Password: ");

    const browser = await chromium.launch({
        headless: false,
    });

    const page = await browser.newPage();

    try {
        // 1. Open login page
        console.log("\nOpening SSN LMS...");

        await page.goto(LMS_LOGIN_URL, {
            waitUntil: "domcontentloaded",
        });

        // 2. Enter credentials
        await page.locator('input[name="username"]').fill(digitalId);
        await page.locator('input[name="password"]').fill(password);

        console.log("✓ Credentials entered.");

        // 3. Login
        await page.locator('button[type="submit"]').click();

        await page.waitForTimeout(5000);

        console.log("Current URL:", page.url());
        console.log("Page title:", await page.title());

        const bodyText = await page.locator("body").innerText();

        console.log("\n--- LMS MESSAGE ---");
        console.log(bodyText.substring(0, 3000));
        console.log("--- END LMS MESSAGE ---\n");

        // 4. Go to My Courses
        console.log("\nOpening My Courses...");

        await page.goto(MY_COURSES_URL, {
            waitUntil: "domcontentloaded",
        });

        await page.waitForTimeout(2000);

        
        console.log("Current URL:", page.url());

        // 5. Find the course search box
        const searchBox = page.getByRole("searchbox", {
            name: "Search courses",
        });

        console.log(
            "Course search boxes found:",
            await searchBox.count()
        );

        if (await searchBox.count() === 1) {
            console.log("✓ Course search box found!");

            await searchBox.fill("Principles of Machine Learning");

            console.log("✓ Course name entered.");

            await page.waitForTimeout(3000);
            // Get all visible course links
            const courseLinks = page.locator("a");

            const courses = [];
            const linkCount = await courseLinks.count();

            for (let i = 0; i < linkCount; i++) {
                const link = courseLinks.nth(i);

                const text = (await link.innerText()).trim();

                if (
                    text &&
                    text.toLowerCase().includes("principles of machine learning")
                ) {
                    const href = await link.getAttribute("href");

                    if (href) {
                        courses.push({
                            name: text,
                            url: href,
                        });
                    }
                }
            }

            console.log("\nCourses found:");

            courses.forEach((course, index) => {
                console.log(`${index + 1}. ${course.name}`);
            });

            if (courses.length === 0) {
                console.log("✗ No matching courses found.");
            } else {
                const choice = await askQuestion(
                    `\nSelect a course (1-${courses.length}): `
                );

                const selectedIndex = Number(choice) - 1;

    if (
        Number.isInteger(selectedIndex) &&
        selectedIndex >= 0 &&
        selectedIndex < courses.length
    ) {
        const selectedCourse = courses[selectedIndex];

        console.log("\n✓ Selected course:");
        console.log(selectedCourse.name);

        // Moodle may return a relative URL such as /course/view.php?id=123
        const courseUrl = new URL(
            selectedCourse.url,
            page.url()
        ).href;

        console.log("\nOpening course...");
        console.log(courseUrl);

        await page.goto(courseUrl, {
            waitUntil: "domcontentloaded",
        });

        await page.waitForTimeout(3000);

        console.log("\n✓ Course page opened");
        console.log("Current URL:", page.url());
        console.log("Page title:", await page.title());
    } else {
        console.log("✗ Invalid course selection.");
    }
}
        } else {
            console.log("✗ Course search box not found.");
        }

        console.log("\nBrowser will remain open for 30 seconds...");

        await page.waitForTimeout(30000);

    } catch (error) {
        console.error("\nError:", error.message);
    } finally {
        await browser.close();
    }
}

testCourseSearch();

//ahamedjaseem2410548@ssn.edu.in
//Jas123eem456#*#*#*