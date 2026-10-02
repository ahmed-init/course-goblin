const readline = require("readline");

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

async function findCourse(page, courseName) {
    console.log(`\nSearching for: ${courseName}`);

    // Find the "Search courses" box
    const searchBox = page.getByRole("searchbox", {
        name: "Search courses",
    });

    await searchBox.fill(courseName);

    // Wait for Moodle to filter the courses
    await page.waitForTimeout(2000);

    /*
     * Moodle displays the course names as links.
     * We look for links containing the requested course name.
     */
    const links = page.locator("a");

    const matches = [];
    const count = await links.count();

    for (let i = 0; i < count; i++) {
        const link = links.nth(i);

        const text = (await link.innerText()).trim();

        if (!text) {
            continue;
        }

        if (
            text.toLowerCase().includes(courseName.toLowerCase())
        ) {
            const href = await link.getAttribute("href");

            if (href && !matches.some((course) => course.url === href)) {
                matches.push({
                    name: text,
                    url: href,
                });
            }
        }
    }

    console.log(`Found ${matches.length} matching course(s).`);

    if (matches.length === 0) {
        console.log("No matching course found.");
        return null;
    }

    // Only one course found
    if (matches.length === 1) {
        console.log(`✓ Course found: ${matches[0].name}`);

        return matches[0];
    }

    // Multiple courses found
    console.log("\nMultiple courses found:\n");

    matches.forEach((course, index) => {
        console.log(`${index + 1}. ${course.name}`);
    });

    console.log("");

    let choice;

    while (true) {
        choice = await askQuestion(
            `Select a course (1-${matches.length}): `
        );

        const number = Number(choice);

        if (
            Number.isInteger(number) &&
            number >= 1 &&
            number <= matches.length
        ) {
            return matches[number - 1];
        }

        console.log("Invalid choice. Please enter a valid number.");
    }
}

module.exports = {
    findCourse,
};

//ahamedjaseem2410548@ssn.edu.in
//Jas123eem456#*#*#*