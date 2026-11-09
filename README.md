# GoOnco — research together

Community-led, nonprofit-oriented prostate cancer research and learning software.
Website: https://goonco.org · Source and task board: https://github.com/jasgoonco/goonco

This repository contains only GoOnco's information-only MVP and its contribution documents. It does not contain the parent planning workspace, business-project repositories, real patient data, inbox addresses or production secrets. Owner-specific hosting configuration is excluded from this public source export. Local builds work without it; deploying your own copy requires registering/configuring your own host project. Do not import other projects' data, accounts, histories or credentials.

## Try it

Public browsing requires no ChatGPT account when the public release is enabled. Research chat uses a guided query router, not a paid AI model. Five bounded public-metadata connections: PubMed, Europe PMC, ClinicalTrials.gov, GDC and cBioPortal. Topic-specific PSA, screening and treatment searches provide source-linked NCI editorial explanations, topical publication metadata and bounded registry purpose excerpts. Downloadable 8D learning reports adapt their purpose to the selected persona and remain open/unapproved. They are structured education and research planning, not clinical investigations or inferred treatment effects. Charts describe source records; they are not treatment-effect evidence. Local file analysis accepts synthetic practice aggregates only.

Persona views and templates support patients, caregivers, clinicians, researchers, institutions and volunteers. All roles are self-selected presentation only. Member accounts, private contribution storage, professional verification, clinical recommendations, patient matching and real health uploads are NOT implemented. Reviewer readiness is a fictional exercise, not an appointment or approval.

Information only; consult qualified professionals before applying information. Registered-charity status, endorsements, vendor support and clinical validation are not established. No donations are accepted.

## Develop

Node 20.11+; no runtime dependencies. From this repository:

    npm run build
    npm test
    npm run validate
    npm run preview:fixtures

The labeled synthetic UI harness binds to http://127.0.0.1:4174. It does not exercise hosted access and must not be exposed to a network. Use fictional inputs only.

The Worker defaults to private sign-in/PIN access unless PUBLIC_BROWSING is exactly true. In public mode only explicitly listed informational routes and a bounded read-only query are exposed. Reserved /review routes additionally require configured owner email, platform identity and PIN. Platform identity headers must be injected/validated by the host; do not deploy behind a server that accepts spoofed identity headers. Member authentication remains a separate future feature. Production secrets belong in the host's secret manager; never commit .env values or credentials. .env.example contains names only.

## Contribute

See CONTRIBUTING.md, GOVERNANCE.md, SECURITY.md, CODE_OF_CONDUCT.md and SUPPORT_PROGRAMS.md. Start with a GitHub issue or volunteers@goonco.org. Product feedback: feedback@goonco.org. No patient records in issues, pull requests, email or AI prompts.

## License and data rights

The original MVP code and accompanying contribution documentation are MIT licensed; commercial reuse is permitted with required notices. This license does not grant rights in third-party API content, publications, trademarks or patient/institutional information. Data-source licensing and scientific approvals are separate and remain pending. Example values are synthetic. Code publication does not approve clinical use.


Oncology discovery: search supports All oncology and 28 listed cancer categories across PubMed, Europe PMC and ClinicalTrials.gov. Only recognized cancer/topic settings are transmitted, never raw questions. Check the displayed scope; arbitrary medicine names and detailed natural-language concepts are not yet searched. Genomic connectors remain fixed prostate snapshots and are excluded from other cancer scopes. Broad-cancer 8D reports are research-planning templates, not disease-specific reviewed explanations.


Visual reports now compare live registry study designs, enrollment (actual versus estimated), endpoints, follow-up and posted-results availability. Clinician style organizes diagnosis, prognosis, medication and testing discussion questions. PSA adds a separately sourced CAP-2024 screening snapshot, not an API-derived clinical effect or personal prediction. All reports are information-only and open to professional review. See [outreach kit](OUTREACH_KIT.md) for draft invitations and bounded contribution roles.


Volunteer interest: review a readable application at #volunteer, then open an email to volunteers@goonco.org, copy/share it or save a .txt file. Visitors send themselves; preparing or downloading does not submit an application. No receipt or membership is created by the form.
