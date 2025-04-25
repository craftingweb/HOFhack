# AppealRX

## Inspiration
Mental health claims are denied at nearly twice the rate of other medical services. Solo practitioners—who represent 47% of psychologists—often lack the billing staff, legal teams, or infrastructure to effectively handle appeals. As a result, patients are left to navigate complex policy language and administrative processes on their own.

We saw an opportunity to build a tool that empowers individuals to advocate for themselves with the support of AI, precedent, and payer-specific policy guidance.

## What it does
AppealRX helps patients rewrite and improve insurance appeal letters after a denial of mental health services. Users upload their draft, doctor’s note, and any supporting documents. The system analyzes the submission, retrieves similar past appeals and policy rules, and returns a refined draft with specific suggestions.

AppealRX also includes a **success prediction model**—a classifier trained on historical appeal outcomes—which scores each draft’s likelihood of being approved. Together, these tools give users both actionable edits and a clear understanding of how their case compares to successful ones.

## How we built it

**Frontend:**
- Built using **TypeScript** with **Next.js**
- Styled with **Tailwind CSS**
- Deployed via **Vercel**

**Backend:**
- **MongoDB** stores user drafts, model outputs, and metadata.
- **Pinecone** is used as our vector database, indexing past appeals, insurer policies, and mental health guidelines.
- A fine-tuned **BERT model** trained on 7000+ appeals notes classifies whether a draft appeal is likely to result in a favorable decision
- A custom **Retrieval-Augmented Generation (RAG)** pipeline retrieves relevant legal and clinical language.
- To manage vector scaling, we route queries by insurance provider and preprocess large PDFs to extract and index only relevant content.

## Challenges we ran into
- **Data Quality:** Medical appeals data was unstructured and inconsistent. Many documents included the appeal decision in the note body, causing label leakage. We resolved this by lemmatizing and filtering out outcome-related terms like *"denied"*, *"approved"*, or *"overturned"* and leading alnguage.
- **Database Scaling:** Retrieval slowed as more appeals and documents were added. We built a routing layer to narrow the search scope based on the user’s insurer.
- **Policy Document Parsing:** We needed to preprocess PDFs to extract key terms (e.g., definitions of medical necessity) to feed into the RAG pipeline.

## Accomplishments that we're proud of
- Built a fully functioning **RAG-based appeal assistant** in under 36 hours.
- Fine-tuned a **BERT classifier** to predict appeal outcomes with strong accuracy.
- Designed a **scalable vector retrieval system** based on user context (insurer).
- Created a clean and intuitive **user interface** to lower the barrier to appeal.

## What we learned
- Preprocessing is critical when dealing with real-world clinical data.
- Building a fast and relevant retrieval system requires careful routing and vector management.
- The mental health advocacy space is under-supported—tools like this can offer huge impact with even small improvements in usability and clarity.

## What's next for AppealRX
- Expand to include other medical denial types (e.g., chronic conditions, surgeries).
- Partner with **advocacy nonprofits** and **solo practices** to pilot real-world cases.
- Add tools for **clinicians** to auto-generate appeals for patients.
- Build **dashboards** to track reasons for denial and provide best practices for future appeals.

Ultimately, we want to make appeals **fairer, more transparent**, and **easier to win**—especially for those most vulnerable.

## Built With
- `bert`
- `deepseek`
- `mongodb`
- `next.js`
- `pinecone`
- `python`
- `railway`
- `tailwind`
- `typescript`
- `vercel`

## Try it out
🔗 [appealrx.vercel.app](https://appealrx.vercel.app)  

![hof](https://github.com/user-attachments/assets/0d51c65c-e6fc-44b4-91d2-cbbe59bfe383)

