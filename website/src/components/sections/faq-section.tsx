import { faqItems } from "@/data/site-content";
import { Eyebrow } from "@/components/ui/eyebrow";

export function FaqSection() {
  return (
    <section aria-labelledby="faq-title" className="faq-section" id="faq">
      <div className="content-wrap faq-layout">
        <div className="faq-intro">
          <Eyebrow>FAQs</Eyebrow>
          <h2 id="faq-title">Got a Question? Find Your Answer Here</h2>
          <p>A few things you might want to know before we start working together.</p>
        </div>

        <div className="faq-list">
          {faqItems
            .filter((item) => item.status === "Published")
            .sort((a, b) => a.order - b.order)
            .map((item, index) => (
              <details className="faq-item" key={item.q} open={index === 0}>
                <summary>
                  <span>{item.q}</span>
                  <span aria-hidden="true" className="faq-icon" />
                </summary>
                <p>{item.ans}</p>
              </details>
            ))}
        </div>
      </div>
    </section>
  );
}
