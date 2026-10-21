import { expect, test } from "@playwright/test";

test("lead and newsletter forms submit to the Firestore emulator", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("requestfailed", (request) => {
    if (request.url().includes("8080")) {
      console.log(`Firestore request failed: ${request.failure()?.errorText}`);
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await expect(page.locator(".cta .lead-form")).toHaveCount(0);
  await page.getByRole("link", { name: "Schedule a Call" }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(
    page.getByRole("heading", {
      name: "Have an idea in mind? Let’s shape it, build it, and bring it into the world.",
    }),
  ).toBeVisible();
  await page.getByLabel("Your name").fill("Emulator Test");
  await page
    .getByLabel("Email address", { exact: false })
    .first()
    .fill("lead@example.com");
  await page.getByLabel("What do you need?").selectOption("Website");
  await page.getByLabel("Project details").fill("A local emulator integration test.");
  await page.getByRole("button", { name: "Send project inquiry" }).click();
  await expect(
    page.getByText("Thanks for reaching out. We’ll be in touch soon."),
  ).toBeVisible({ timeout: 30_000 });
  const inquiryDialog = page.getByRole("dialog");
  await expect(inquiryDialog).toBeVisible();
  const emailLink = inquiryDialog.getByRole("link", { name: "Send with Gmail" });
  await expect(emailLink).toHaveAttribute(
    "href",
    /https:\/\/mail\.google\.com\/mail\/\?view=cm&fs=1&to=hello%40kitaristudio\.com&su=Project%20inquiry/,
  );
  await expect(emailLink).toHaveAttribute("target", "_blank");
  const whatsappLink = inquiryDialog.getByRole("link", { name: "Send with WhatsApp" });
  await expect(whatsappLink).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/6289512842356\?text=/,
  );
  await expect(inquiryDialog.locator('a[href^="mailto:"]')).toHaveCount(0);
  await inquiryDialog.getByRole("button", { name: "Done" }).click();
  await expect(inquiryDialog).toHaveCount(0);
  const leadFormFitsMobile = await page.locator(".lead-form").evaluate((form) => {
    const bounds = form.getBoundingClientRect();
    return bounds.left >= 0 && bounds.right <= window.innerWidth;
  });
  expect(leadFormFitsMobile).toBe(true);

  await page.goto("/");
  await page.locator("#nl input[name=email]").fill("subscriber@example.com");
  await page.getByRole("button", { name: "Subscribe" }).click();
  await expect(page.getByText("Thanks for subscribing.")).toBeVisible();
  expect(errors).toEqual([]);
});
