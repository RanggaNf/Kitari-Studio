import { expect, test } from "@playwright/test";

test("administrator signs in and manages content", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("Email address").fill("kitari-admin@example.test");
  const password = page.getByLabel("Password");
  await password.fill("AdminTestPass123!");
  await page.getByRole("button", { name: "Show" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide" }).click();
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText("New leads")).toBeVisible();
  await expect(page.getByText("Lead pipeline")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Quick admin actions" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("button", { name: "Analytics" }).click();
  await expect(
    page.getByRole("heading", { name: "Page popularity heatmap" }),
  ).toBeVisible();
  await expect(page.getByText("Secure GA4 reporting connection needed")).toBeVisible();
  await expect(page.getByLabel("Active visitors: unavailable")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    )
    .toBe(true);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("button", { name: "Overview" }).click();

  await page.getByRole("button", { name: /Manage projects/ }).click();
  await expect(page.getByRole("heading", { name: "Our work" })).toBeVisible();
  await page.getByRole("button", { name: "Add item" }).click();
  await expect(page.locator(".cloudinary-gallery-item")).toHaveCount(3);
  await expect(page.getByText("Detail image 1")).toBeVisible();
  await expect(page.getByText("Detail image 2")).toBeVisible();
  await expect(page.getByText("Detail image 3")).toBeVisible();
  await page.getByLabel("Project name").fill("Admin integration project");
  await page.getByLabel("Country").fill("Indonesia");
  await page.getByLabel("Year").fill("2026");
  await page.getByLabel("Client", { exact: true }).fill("Kitari QA Client");
  await page
    .getByLabel("Client comment / testimonial")
    .fill("The team made our project clearer and easier to use.");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Created by the admin panel browser test.");
  let uploadedWebp = false;
  await page.route(
    "https://api.cloudinary.com/v1_1/dpfh30b2v/image/upload",
    async (route) => {
      const requestBody = route.request().postDataBuffer()?.toString("latin1") ?? "";
      uploadedWebp = requestBody.includes("image/webp");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          secure_url:
            "https://res.cloudinary.com/dpfh30b2v/image/upload/v1/admin-test.webp",
          public_id: "admin-test",
          width: 1600,
          height: 1200,
          format: "webp",
          bytes: 45000,
        }),
      });
    },
  );
  await page
    .getByLabel("Choose image to crop and upload")
    .first()
    .setInputFiles("public/images/rectangle-25.png");
  const projectCropFrame = page.getByRole("dialog").locator(".image-crop-viewport");
  await expect
    .poll(() =>
      projectCropFrame.evaluate((frame) => {
        const bounds = frame.getBoundingClientRect();
        return Number((bounds.width / bounds.height).toFixed(2));
      }),
    )
    .toBe(1.33);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Crop and upload WebP" })
    .click();
  await expect(page.locator('input[name="img"]')).toHaveValue(
    "https://res.cloudinary.com/dpfh30b2v/image/upload/v1/admin-test.webp",
  );
  expect(uploadedWebp).toBe(true);
  await page.getByLabel("Image description").fill("Integration test project");
  await page.getByLabel("Project tags (comma-separated)").fill("Website, Testing");
  await page.getByLabel("Display order").fill("88");
  await page.getByLabel("Visibility").selectOption("Published");
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page.getByText("Admin integration project")).toBeVisible();
  await expect(page.getByText("Published").first()).toBeVisible();
  const contentFilters = page.getByRole("group", { name: "Filter content by status" });
  await expect(contentFilters.getByRole("button", { name: "Published 1" })).toBeVisible();
  await contentFilters.getByRole("button", { name: "Drafts 0" }).click();
  await expect(page.getByText("No draft items match this view.")).toBeVisible();
  await contentFilters.getByRole("button", { name: "All 1" }).click();

  const publicPage = await page.context().newPage();
  await publicPage.goto("/");
  await expect(
    publicPage.locator(".proj").filter({ hasText: "Admin integration project" }),
  ).toBeVisible();
  await publicPage.close();

  const projectRow = page
    .getByRole("row")
    .filter({ hasText: "Admin integration project" });
  await projectRow.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Project name").fill("Admin integration project edited");
  await page.getByLabel("Visibility").selectOption("Draft");
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page.getByText("Admin integration project edited")).toBeVisible();
  await expect(page.getByText("Draft").first()).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await projectRow.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Admin integration project edited")).toHaveCount(0);

  await page.getByRole("button", { name: "Catalogue" }).click();
  await page.getByRole("button", { name: "Add item" }).click();
  await page.getByLabel("Package name").fill("Square crop check");
  await page.getByLabel("Starting price").fill("$100");
  await page
    .getByLabel("Choose image to crop and upload")
    .setInputFiles("public/images/rectangle-25.png");
  const catalogueCropFrame = page.getByRole("dialog").locator(".image-crop-viewport");
  await expect
    .poll(() =>
      catalogueCropFrame.evaluate((frame) => {
        const bounds = frame.getBoundingClientRect();
        return Number((bounds.width / bounds.height).toFixed(2));
      }),
    )
    .toBe(1);
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Services" }).click();
  await page.getByRole("button", { name: "Add item" }).click();
  await expect(
    page.getByText(/Background image.*display order must not be 1/i),
  ).toHaveCount(0);
  await page.getByLabel("Service name").fill("Portrait crop check");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Checking service image crop dimensions.");
  await page.getByLabel("Display order").fill("2");
  const serviceBackgroundField = page.locator(".admin-field").filter({
    has: page.getByText(/Background image.*display order must not be 1/i),
  });
  await expect(serviceBackgroundField).toBeVisible();
  await serviceBackgroundField
    .getByLabel("Choose image to crop and upload")
    .setInputFiles("public/images/rectangle-25.png");
  const serviceBackgroundCropFrame = page
    .getByRole("dialog")
    .locator(".image-crop-viewport");
  await expect
    .poll(() =>
      serviceBackgroundCropFrame.evaluate((frame) => {
        const bounds = frame.getBoundingClientRect();
        return Number((bounds.width / bounds.height).toFixed(2));
      }),
    )
    .toBe(1.78);
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  await page
    .getByLabel("Choose image to crop and upload")
    .setInputFiles("public/images/rectangle-25.png");
  const serviceCropFrame = page.getByRole("dialog").locator(".image-crop-viewport");
  await expect
    .poll(() =>
      serviceCropFrame.evaluate((frame) => {
        const bounds = frame.getBoundingClientRect();
        return Number((bounds.width / bounds.height).toFixed(2));
      }),
    )
    .toBe(0.9);
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Leads" }).click();
  const leadRow = page.getByRole("row").filter({ hasText: "Admin QA Lead" });
  await expect(leadRow).toBeVisible();
  await leadRow.getByRole("combobox").selectOption("Contacted");
  await expect(leadRow.getByRole("combobox")).toHaveValue("Contacted");
  await leadRow.getByRole("button", { name: "Open" }).click();
  await expect(page.getByText("Test lead details for the admin panel.")).toBeVisible();
  const leadDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await leadDownload).suggestedFilename()).toBe("kitari-leads.csv");

  await page.getByRole("button", { name: "Newsletter" }).click();
  await expect(page.getByText("admin-newsletter@example.test")).toBeVisible();

  await page.getByRole("button", { name: "About section" }).click();
  await expect(
    page.getByRole("heading", { name: "About section content" }),
  ).toBeVisible();
  await expect(page.getByLabel("About image description")).toHaveValue(
    "Kitari Studio project preview",
  );
  await expect(page.getByLabel("About statistic 1 — number")).toHaveValue("5+");
  const aboutImageField = page.locator(".admin-field").filter({
    has: page.getByText("About center image", { exact: true }),
  });
  await aboutImageField
    .getByLabel("Choose image to crop and upload")
    .setInputFiles("public/images/rectangle-25.png");
  await expect
    .poll(() =>
      page
        .getByRole("dialog")
        .locator(".image-crop-viewport")
        .evaluate((frame) => {
          const bounds = frame.getBoundingClientRect();
          return Number((bounds.width / bounds.height).toFixed(2));
        }),
    )
    .toBe(1.68);
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Site settings" }).click();
  await expect(page.getByLabel("Studio name")).toHaveValue("Kitari Studio");
  await page.getByLabel("Studio name").fill("Kitari Studio QA");
  await page.getByLabel("Instagram URL").fill("https://instagram.com/kitaristudio");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Site settings saved successfully.")).toBeVisible();

  await page.getByRole("button", { name: "Appearance" }).click();
  await expect(page.getByRole("heading", { name: "Website appearance" })).toBeVisible();
  await page.getByLabel("Website font").selectOption("Arial");
  await page.getByLabel("Global text size scale").fill("1.1");
  await expect(page.getByText("Text scale: 110%")).toBeVisible();
  await expect(page.getByText("Thoughtful digital experiences")).toHaveCSS(
    "font-family",
    /Arial/,
  );

  await page.getByRole("button", { name: "Homepage text" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "Homepage text" }),
  ).toBeVisible();
  await expect(page.locator('textarea[name="homeTestimonialsDescription"]')).toHaveValue(
    /Lorem ipsum/,
  );
  for (let index = 1; index <= 10; index += 1) {
    await expect(page.locator(`input[name="heroCard${index}"]`)).toBeAttached();
  }
  await expect(page.locator('input[name="homeFooterCopyright"]')).toHaveValue(
    /Kitari Studio/,
  );

  await page.reload();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("a signed-in non-admin account is rejected", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill("kitari-regular@example.test");
  await page.getByLabel("Password").fill("RegularTestPass123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByText("This account does not have admin access.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("an unverified account is signed out and receives a verification email", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill("kitari-unverified@example.test");
  await page.getByLabel("Password").fill("UnverifiedTestPass123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByText(
      "A verification link has been sent. Verify your email, then sign in again.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login$/);
});
