import { testimonials } from "@/data/site-content";
import { Eyebrow } from "@/components/ui/eyebrow";

export function TestimonialsSection() {
  return (
    <section
      aria-labelledby="testimonials-title"
      className="testimonials-section"
      id="testimonial"
    >
      <div className="content-wrap">
        <div className="section-heading testimonials-heading">
          <Eyebrow>Testimonials</Eyebrow>
          <h2 id="testimonials-title">Proof That We Deliver Straight Up</h2>
          <p>
            Thoughtful collaboration and creative work, shared in our clients&apos; own
            words.
          </p>
        </div>

        <div className="testimonials-grid">
          {testimonials
            .filter((testimonial) => testimonial.status === "Published")
            .sort((a, b) => a.order - b.order)
            .map((testimonial) => (
              <figure className="testimonial-item" key={testimonial.name}>
                <blockquote>{testimonial.quote}</blockquote>
                <figcaption>
                  <span aria-hidden="true" className="testimonial-initial">
                    {testimonial.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <span>
                    <strong>{testimonial.name}</strong>
                    <small>{testimonial.company}</small>
                  </span>
                </figcaption>
              </figure>
            ))}
        </div>
      </div>
    </section>
  );
}
