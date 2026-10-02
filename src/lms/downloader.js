const fs = require("fs");
const path = require("path");

/**
 * Make a filename/folder name safe for the filesystem.
 */
function sanitizeName(name) {
    return name
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Download all Moodle resources from an opened course.
 *
 * The page must already be logged into SSN LMS
 * and currently displaying the course.
 */
async function downloadCourseMaterials(page, courseName) {
    const downloadRoot = path.join(
        process.cwd(),
        "downloads",
        sanitizeName(courseName)
    );

    fs.mkdirSync(downloadRoot, { recursive: true });

    console.log("\n========================================");
    console.log("Starting course download");
    console.log("========================================");
    console.log(`Course: ${courseName}`);
    console.log(`Saving to: ${downloadRoot}\n`);

    // Remember the course page.
    const courseUrl = page.url();

    const sections = page.locator("li.section");
    const sectionCount = await sections.count();

    console.log(`Found ${sectionCount} sections.\n`);

    let totalDownloaded = 0;

    for (let i = 0; i < sectionCount; i++) {
        const section = sections.nth(i);

        const heading = section.locator(
            ".sectionname, .section-title, h3, h4"
        ).first();

        let sectionName = "";

        if (await heading.count()) {
            sectionName = (await heading.innerText()).trim();
        }

        if (!sectionName) {
            sectionName = `Section ${i + 1}`;
        }

        const safeSectionName = sanitizeName(sectionName);

        const sectionFolder = path.join(
            downloadRoot,
            safeSectionName
        );

        fs.mkdirSync(sectionFolder, { recursive: true });

        console.log("\n----------------------------------------");
        console.log(`📁 ${sectionName}`);
        console.log("----------------------------------------");

        const links = section.locator("a");
        const linkCount = await links.count();

        for (let j = 0; j < linkCount; j++) {
            const link = links.nth(j);

            const text = (await link.innerText()).trim();
            const href = await link.getAttribute("href");

            if (!href) {
                continue;
            }

            // Only process Moodle File/Resource activities.
            if (!href.includes("/mod/resource/view.php")) {
                continue;
            }

            const resourceName = text
                .replace(/\s+/g, " ")
                .trim();

            console.log(`\n📄 ${resourceName || "Unnamed resource"}`);

            const resourceUrl = new URL(href, courseUrl).href;

            try {
                // Open the Moodle resource.
                await page.goto(resourceUrl, {
                    waitUntil: "domcontentloaded",
                });

                await page.waitForTimeout(500);

                const fileUrl = page.url();

                console.log(`   File URL: ${fileUrl}`);

                if (!fileUrl.includes("/pluginfile.php/")) {
                    console.log(
                        "   ⚠ Resource did not redirect to a file."
                    );

                    await page.goto(courseUrl, {
                        waitUntil: "domcontentloaded",
                    });

                    continue;
                }

                // Extract filename from the final URL.
                const urlObject = new URL(fileUrl);

                const rawFilename = decodeURIComponent(
                    path.basename(urlObject.pathname)
                );

                let filename = sanitizeName(rawFilename);

                if (!filename || filename === ".") {
                    filename = `${sanitizeName(resourceName)}.pdf`;
                }

                const destination = path.join(
                    sectionFolder,
                    filename
                );

                console.log(`   Saving: ${filename}`);

                /*
                 * Fetch through the browser context.
                 *
                 * This request uses the same authenticated
                 * session as the LMS.
                 */
                const response = await page.context().request.get(
                    fileUrl
                );

                if (!response.ok()) {
                    throw new Error(
                        `HTTP ${response.status()}`
                    );
                }

                const buffer = await response.body();

                fs.writeFileSync(destination, buffer);

                console.log("   ✓ Downloaded");

                totalDownloaded++;
            } catch (error) {
                console.log(
                    `   ✗ Download failed: ${error.message}`
                );
            }

            // Return to the course before processing
            // the next resource.
            await page.goto(courseUrl, {
                waitUntil: "domcontentloaded",
            });

            await page.waitForTimeout(300);
        }
    }

    console.log("\n========================================");
    console.log("Download complete");
    console.log("========================================");
    console.log(`Files downloaded: ${totalDownloaded}`);
    console.log(`Location: ${downloadRoot}`);
}

module.exports = {
    downloadCourseMaterials,
};