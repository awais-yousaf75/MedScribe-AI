# ============================================================
# Medical Knowledge Base Documents — Expanded Edition
# ============================================================

MEDICAL_KNOWLEDGE_BASE = [

    # ── 1. SOAP NOTE FORMAT ──────────────────────────────────
    """
    SOAP Note Format — Clinical Documentation Standard:

    S (Subjective): Patient's chief complaint in their own words, history of present illness (HPI)
    using OLDCARTS framework: Onset, Location, Duration, Character, Aggravating factors,
    Relieving factors, Timing, Severity (0-10 scale). Also includes: past medical history,
    current medications, allergies, family history, social history, review of systems.

    O (Objective): Vital signs (BP, HR, RR, Temp, SpO2, Weight, Height, BMI, blood glucose),
    physical examination findings by system (general appearance, cardiovascular, respiratory,
    abdominal, neurological, musculoskeletal, skin), laboratory results, imaging findings,
    ECG findings, procedure results.

    A (Assessment): Primary diagnosis with ICD-10 code, differential diagnoses listed in
    order of likelihood with reasoning, clinical impression, problem list prioritized
    by acuity, risk stratification.

    P (Plan): Investigations ordered, medications prescribed with full dose/route/frequency/
    duration, non-pharmacological interventions, referrals with urgency, patient education,
    follow-up plan with timing, safety netting advice, red flags to return.
    """,

    # ── 2. MEDICAL HISTORY COMPONENTS ───────────────────────
    """
    Medical History Components — Comprehensive Framework:

    Chief Complaint (CC): Primary reason for visit in patient's own words. Duration included.

    History of Present Illness (HPI) — OLDCARTS:
    - Onset: When did it start? Sudden vs gradual?
    - Location: Where exactly? Does it radiate?
    - Duration: How long does each episode last?
    - Character: Sharp, dull, burning, crushing, throbbing, stabbing, aching, cramping?
    - Aggravating factors: What makes it worse? Exertion, food, position, breathing?
    - Relieving factors: What makes it better? Rest, medications, position change?
    - Timing: Constant vs intermittent? Frequency of episodes?
    - Severity: 0–10 pain scale. Functional impairment?

    Past Medical History (PMH): Chronic conditions, previous diagnoses, hospitalizations,
    surgeries, procedures, vaccinations, recent illnesses.

    Medications: Current prescriptions (name, dose, frequency), OTC medications,
    herbal supplements, vitamins, recent changes.

    Allergies: Drug allergies with reaction type (anaphylaxis, rash, GI upset),
    food allergies, environmental allergies. NKDA = No Known Drug Allergies.

    Family History (FH): First-degree relatives — heart disease, diabetes, hypertension,
    cancer (type), stroke, mental illness, genetic conditions.

    Social History (SH): Occupation, marital status, living situation, smoking (pack-years =
    packs/day × years), alcohol (units/week), recreational drugs, exercise habits,
    diet, sexual history if relevant, travel history.

    Review of Systems (ROS): Systematic organ-system review —
    Constitutional (fever, fatigue, weight loss), HEENT, Cardiovascular, Respiratory,
    GI, GU, Musculoskeletal, Neurological, Psychiatric, Skin, Endocrine, Hematologic.
    """,

    # ── 3. PRESCRIPTION WRITING STANDARDS ───────────────────
    """
    Prescription Writing Standards — Complete Guide:

    Every valid prescription must contain:
    1. Patient name, date of birth, date of prescription
    2. Drug name — generic preferred (INN name)
    3. Strength/concentration (e.g., 500mg, 0.1%)
    4. Dosage form: tablet, capsule, liquid, injection, cream, ointment, patch, inhaler, drops
    5. Route of administration: PO (oral), IV (intravenous), IM (intramuscular),
       SC (subcutaneous), SL (sublingual), topical, inhaled, PR (rectal), intranasal
    6. Frequency abbreviations:
       OD = once daily, BD = twice daily, TDS = three times daily, QID = four times daily,
       PRN = as needed, STAT = immediately, QHS = at bedtime, QOD = every other day,
       QWK = weekly, AC = before meals, PC = after meals
    7. Duration (e.g., x7 days, x1 month, ongoing)
    8. Quantity to dispense
    9. Number of refills
    10. Special instructions: with food, avoid alcohol, avoid sunlight, morning dose,
        shake well, refrigerate, do not crush

    Prescriber: name, registration number, signature, contact.

    High-risk medications requiring extra caution:
    - Warfarin: INR monitoring required
    - Lithium: serum levels monitoring required
    - Digoxin: narrow therapeutic window
    - Methotrexate: weekly dosing only — daily dosing is FATAL
    - Opioids: risk of dependence, respiratory depression
    - Insulin: hypoglycemia risk, dose varies by glucose
    """,

    # ── 4. ANTIBIOTICS ───────────────────────────────────────
    """
    Antibiotics — Dosing, Indications, and Counselling:

    PENICILLINS:
    - Amoxicillin 500mg TDS x7d PO → Bacterial infections, otitis media, sinusitis, UTI, URTI
    - Amoxicillin-Clavulanate (Augmentin) 625mg BD x7d → Resistant infections, animal bites, LRTI
    - Flucloxacillin 500mg QID x7d → Skin/soft tissue, staphylococcal infections
    Do's: Complete full course. Take on empty stomach (amoxicillin-clavulanate with food).
    Don'ts: Don't skip doses. Avoid in penicillin allergy. Watch for diarrhea, rash.

    MACROLIDES:
    - Azithromycin 500mg OD x3d or 500mg day 1 then 250mg x4d → Atypical pneumonia, STIs, skin
    - Clarithromycin 500mg BD x7d → H. pylori (triple therapy), URTI, skin infections
    Do's: Can be taken with or without food.
    Don'ts: Avoid in QT prolongation. Interacts with statins (rhabdomyolysis risk).

    FLUOROQUINOLONES:
    - Ciprofloxacin 500mg BD x7d → UTI, GI infections, prostatitis, bone/joint
    - Levofloxacin 500mg OD x7d → Community-acquired pneumonia, complex UTI
    Do's: Drink plenty of water. Take at same time each day.
    Don'ts: Avoid in children/pregnancy. Risk of tendon rupture especially in elderly.
    Avoid antacids within 2 hours. Avoid excessive sun exposure.

    NITROIMIDAZOLES:
    - Metronidazole 400mg TDS x7d → Anaerobic infections, H. pylori, bacterial vaginosis, C. diff
    - Tinidazole 2g single dose → Trichomoniasis, giardia
    Do's: Take with food to reduce nausea.
    Don'ts: ABSOLUTELY NO ALCOHOL — severe disulfiram-like reaction (flushing, vomiting).
    Avoid during first trimester of pregnancy.

    CEPHALOSPORINS:
    - Cefalexin 500mg QID x7d → Skin infections, UTI, respiratory
    - Cefuroxime 500mg BD x7d → LRTI, sinusitis, Lyme disease
    Don'ts: 10% cross-reactivity with penicillin allergy — use with caution.

    TETRACYCLINES:
    - Doxycycline 100mg BD x7d → Atypical pneumonia, malaria prophylaxis, acne, STIs
    Do's: Take with full glass of water. Stay upright 30 min after.
    Don'ts: Avoid in children <8 years, pregnancy. Avoid with dairy, antacids, iron.
    Increases photosensitivity — use sunscreen.

    SULFONAMIDES:
    - Trimethoprim-Sulfamethoxazole (Co-trimoxazole) 960mg BD → UTI, PCP prophylaxis
    Don'ts: Avoid in G6PD deficiency, sulfa allergy, third trimester pregnancy.
    """,

    # ── 5. ANALGESICS & NSAIDS ───────────────────────────────
    """
    Analgesics, NSAIDs, and Pain Management:

    NON-OPIOID ANALGESICS:
    - Paracetamol (Acetaminophen) 500-1000mg QID PRN PO → Pain, fever
      Max dose: 4g/day (2g/day in liver disease, alcoholism)
      Do's: Safe in pregnancy, elderly, renal impairment.
      Don'ts: Avoid in hepatic failure. Overdose causes acute liver failure — antidote is N-acetylcysteine.

    NSAIDs:
    - Ibuprofen 400mg TDS PO with food → Inflammation, musculoskeletal pain, dysmenorrhea
    - Diclofenac 50mg BD PO with food → Musculoskeletal, dental pain, gout
    - Naproxen 250-500mg BD PO → Arthritis, menstrual pain, gout
    - Mefenamic Acid 500mg TDS PO with food → Dysmenorrhea, mild-moderate pain
    Do's: Always take NSAIDs with food or milk. Stay well hydrated.
    Don'ts: Avoid in peptic ulcer, renal impairment, heart failure, third trimester pregnancy,
    aspirin-sensitive asthma. Caution in elderly — GI bleeding risk. 
    Avoid concurrent use of multiple NSAIDs.

    COX-2 INHIBITORS:
    - Celecoxib 200mg OD-BD → Osteoarthritis, rheumatoid arthritis (less GI risk)
    Don'ts: Cardiovascular risk — avoid in ischemic heart disease.

    OPIOID ANALGESICS:
    - Tramadol 50-100mg BD-QID → Moderate-severe pain (weak opioid)
    - Codeine 30mg QID → Mild-moderate pain, cough suppression
    - Morphine 10mg 4-hourly → Severe acute pain, palliative care
    - Oxycodone 5-10mg 4-6 hourly → Severe pain
    Do's: Take as prescribed. Use laxatives prophylactically (opioids cause constipation).
    Don'ts: Avoid alcohol — increased CNS depression. Risk of dependence with long-term use.
    Never abruptly stop after long-term use. Avoid driving/machinery.
    Naloxone is the antidote for opioid overdose.

    NEUROPATHIC PAIN:
    - Gabapentin 300mg TDS → Neuropathic pain, post-herpetic neuralgia
    - Pregabalin 75mg BD → Neuropathic pain, fibromyalgia
    - Amitriptyline 10-25mg QHS → Neuropathic pain, migraine prophylaxis
    Don'ts: Gabapentin/pregabalin — avoid abrupt discontinuation. Causes dizziness, somnolence.

    TOPICAL ANALGESICS:
    - Diclofenac gel 1% TDS topical → Localized musculoskeletal pain
    - Capsaicin cream 0.025-0.075% TDS → Neuropathic pain, osteoarthritis
    """,

    # ── 6. CARDIOVASCULAR MEDICATIONS ───────────────────────
    """
    Cardiovascular Medications — Complete Reference:

    ANTIHYPERTENSIVES:

    Calcium Channel Blockers (CCBs):
    - Amlodipine 5-10mg OD → Hypertension, angina, Raynaud's
    - Nifedipine SR 30-60mg OD → Hypertension, angina
    Do's: Monitor BP and heart rate. Ankle swelling is common side effect.
    Don'ts: Avoid grapefruit juice (increases drug levels). Amlodipine — safe in heart failure.

    ACE Inhibitors:
    - Lisinopril 5-40mg OD → Hypertension, heart failure, diabetic nephropathy, post-MI
    - Ramipril 2.5-10mg OD → Hypertension, heart failure, high CV risk
    - Enalapril 5-20mg BD → Hypertension, heart failure
    Do's: Monitor potassium and renal function. Excellent for diabetic patients.
    Don'ts: CONTRAINDICATED in pregnancy (teratogenic). Avoid in bilateral renal artery stenosis.
    Causes dry cough in 10-15% — switch to ARB if intolerable.
    Avoid with potassium supplements (hyperkalemia risk).

    ARBs (Angiotensin Receptor Blockers):
    - Losartan 50-100mg OD → Hypertension, heart failure, diabetic nephropathy
    - Valsartan 80-320mg OD → Hypertension, heart failure post-MI
    - Telmisartan 40-80mg OD → Hypertension, CV risk reduction
    Don'ts: Same contraindications as ACE inhibitors. No cough side effect.

    Beta Blockers:
    - Atenolol 25-100mg OD → Hypertension, tachyarrhythmias, angina, post-MI
    - Metoprolol 25-100mg BD → Hypertension, heart failure, arrhythmias
    - Bisoprolol 2.5-10mg OD → Heart failure (titrate slowly), hypertension
    - Carvedilol 3.125-25mg BD → Heart failure, hypertension
    - Propranolol 40-80mg BD → Hypertension, migraine prophylaxis, tremor, anxiety, thyrotoxicosis
    Do's: Take at same time daily. Do not miss doses.
    Don'ts: NEVER abruptly stop — can precipitate rebound hypertension, angina, MI.
    Avoid in asthma/COPD (bronchospasm). Masks hypoglycemia symptoms in diabetics.
    Caution in heart block, bradycardia.

    Thiazide Diuretics:
    - Hydrochlorothiazide 12.5-25mg OD → Hypertension, edema
    - Indapamide 1.25-2.5mg OD → Hypertension
    Do's: Take in morning to avoid nocturia. Monitor electrolytes (hypokalemia risk).
    Don'ts: Avoid in gout (raises uric acid). Monitor blood glucose (worsens glycemic control).

    Loop Diuretics:
    - Furosemide 20-80mg OD-BD → Heart failure, edema, hypertension
    - Bumetanide 1-2mg OD → Same as furosemide
    Do's: Weigh daily. Take in morning. Replace potassium if low.
    Don'ts: Avoid excessive fluid restriction. Can cause ototoxicity at high doses.

    Potassium-Sparing Diuretics:
    - Spironolactone 25-50mg OD → Heart failure, hyperaldosteronism, ascites
    Don'ts: Avoid in hyperkalemia, renal failure. Can cause gynecomastia.

    ANTIANGINALS:
    - Glyceryl Trinitrate (GTN) spray/tablet SL PRN → Acute angina attack
      Instructions: Sit down, spray under tongue, repeat after 5 min if no relief.
      If no relief after 3 doses — call emergency services.
    - Isosorbide Mononitrate 20-60mg OD-BD → Angina prophylaxis
    Don'ts: Avoid in hypotension. NEVER combine with PDE5 inhibitors (sildenafil) — fatal hypotension.
    Develops tolerance — nitrate-free period of 8-12 hours needed.

    ANTIPLATELETS:
    - Aspirin 75-150mg OD → Secondary prevention CVD, post-MI, post-stroke, ACS
      Loading dose for ACS: Aspirin 300mg stat (chewed)
    - Clopidogrel 75mg OD → Post-stent, ACS, peripheral arterial disease
    - Ticagrelor 90mg BD → ACS (more potent than clopidogrel)
    - Dual antiplatelet therapy (DAPT): Aspirin + Clopidogrel post-stent
    Do's: Take with food to reduce GI irritation. Report unusual bleeding.
    Don'ts: Avoid NSAIDs concurrently. Increased bleeding risk with warfarin.

    ANTICOAGULANTS:
    - Warfarin 2-10mg OD (dose adjusted to INR 2-3) → AF, DVT/PE, mechanical valves
      INR target: 2-3 for most indications, 2.5-3.5 for mechanical mitral valve
    - Heparin IV/SC → Acute DVT/PE, ACS (hospital use)
    - Enoxaparin (LMWH) 1mg/kg BD SC → DVT/PE treatment, ACS
    - Rivaroxaban 20mg OD with evening meal → AF, DVT/PE (NOAC)
    - Apixaban 5mg BD → AF, DVT/PE (NOAC)
    - Dabigatran 150mg BD → AF (NOAC)
    Do's: Warfarin: regular INR monitoring. Consistent vitamin K intake (leafy greens).
    Carry anticoagulant alert card.
    Don'ts: Warfarin interacts with hundreds of drugs and foods. Avoid cranberry juice.
    NOACs: Do not crush or chew. Avoid in severe renal failure.

    STATINS (Lipid-Lowering):
    - Atorvastatin 10-80mg OD at night → Dyslipidemia, CV risk reduction
    - Rosuvastatin 5-40mg OD → Dyslipidemia (more potent than atorvastatin)
    - Simvastatin 10-40mg OD at night → Dyslipidemia
    - Pravastatin 20-40mg OD → Dyslipidemia (fewer drug interactions)
    Do's: Take at night (cholesterol synthesis peaks at night). Lifestyle modification concurrent.
    Don'ts: Avoid grapefruit juice with simvastatin/atorvastatin. Monitor liver enzymes and CK.
    Report muscle pain immediately (myopathy/rhabdomyolysis risk — especially with fibrates).
    Caution with macrolide antibiotics and azole antifungals (increase statin levels).

    ANTIARRHYTHMICS:
    - Digoxin 62.5-250mcg OD → Atrial fibrillation rate control, heart failure
      Narrow therapeutic window — toxicity causes nausea, visual changes (yellow-green halos), bradycardia.
    - Amiodarone 200mg OD → Refractory arrhythmias, VT, AF
      Side effects: photosensitivity, thyroid dysfunction, pulmonary toxicity, corneal deposits.
    - Bisoprolol 2.5-10mg OD → Rate control in AF
    - Verapamil 80-120mg TDS → SVT, rate control in AF (NOT with beta blockers — heart block)
    """,

    # ── 7. RESPIRATORY MEDICATIONS ──────────────────────────
    """
    Respiratory Medications:

    SHORT-ACTING BETA-2 AGONISTS (SABA) — Reliever:
    - Salbutamol (Albuterol) MDI 100mcg 2 puffs PRN → Acute asthma, bronchospasm, COPD
    - Salbutamol nebulizer 2.5mg PRN → Acute severe asthma
    Do's: Shake before use. Rinse mouth after. Use spacer for better delivery.
    If using >3x/week — step up therapy.
    Don'ts: Not for long-term daily use alone in asthma (without ICS).
    Overuse linked to increased mortality.

    LONG-ACTING BETA-2 AGONISTS (LABA):
    - Salmeterol MDI 50mcg BD → Asthma (always with ICS), COPD
    - Formoterol 12mcg BD → Asthma maintenance, COPD
    Don'ts: NEVER use LABA alone in asthma without inhaled corticosteroid — increases mortality risk.

    INHALED CORTICOSTEROIDS (ICS):
    - Beclomethasone 100-400mcg BD → Asthma maintenance
    - Fluticasone 100-500mcg BD → Asthma maintenance
    - Budesonide 200-400mcg BD → Asthma maintenance
    Do's: Rinse mouth and gargle after every dose (prevents oral candidiasis).
    Use spacer device. Continue even when feeling well.
    Don'ts: Do not stop abruptly. Not for acute attacks.

    COMBINATION INHALERS (ICS + LABA):
    - Seretide (Fluticasone/Salmeterol) 25/50mcg, 25/125mcg, 25/250mcg BD
    - Symbicort (Budesonide/Formoterol) 100/6mcg, 200/6mcg BD-QID
    - Fostair (Beclomethasone/Formoterol) 100/6mcg BD

    LONG-ACTING MUSCARINIC ANTAGONISTS (LAMA) — COPD:
    - Tiotropium (Spiriva) 18mcg OD inhaled → COPD maintenance
    - Ipratropium 20mcg 4 puffs QID → COPD, acute bronchospasm
    Do's: Rinse mouth after use. Use HandiHaler device correctly.
    Don'ts: Avoid in narrow-angle glaucoma, urinary retention.

    SYSTEMIC CORTICOSTEROIDS:
    - Prednisolone 30-40mg OD x5d PO → Acute asthma exacerbation
    - Dexamethasone 6mg OD IV/PO → Severe COVID-19, cerebral edema, croup
    - Hydrocortisone 100mg IV QID → Acute severe asthma (hospital)
    Do's: Take in morning with food. Taper if >2 weeks use.
    Don'ts: Do not abruptly stop long-term steroids (adrenal crisis).
    Long-term side effects: osteoporosis, hyperglycemia, Cushingoid features, immunosuppression.

    LEUKOTRIENE RECEPTOR ANTAGONISTS:
    - Montelukast 10mg OD at night → Asthma (adjunct), allergic rhinitis
    Don'ts: Neuropsychiatric side effects reported — monitor mood/behavior.

    MUCOLYTICS/EXPECTORANTS:
    - Bromhexine 8mg TDS → Productive cough, mucus clearance
    - Acetylcysteine 200mg TDS → COPD, mucolytic
    - Carbocisteine 375mg TDS → COPD, bronchiectasis

    ANTIHISTAMINES:
    - Cetirizine 10mg OD → Allergic rhinitis, urticaria, hay fever (non-sedating)
    - Loratadine 10mg OD → Allergic rhinitis (non-sedating)
    - Chlorphenamine 4mg TDS → Allergic reactions, urticaria (sedating)
    - Fexofenadine 120-180mg OD → Allergic rhinitis (non-sedating)
    Do's: Non-sedating antihistamines preferred for daytime use.
    Don'ts: Sedating antihistamines — avoid driving/machinery. Avoid alcohol.

    DECONGESTANTS:
    - Pseudoephedrine 60mg QID x3d → Nasal congestion
    - Xylometazoline nasal spray 0.1% BD x5d max → Nasal congestion
    Don'ts: Do not use nasal decongestants >5-7 days (rebound congestion).
    Avoid pseudoephedrine in hypertension, cardiac disease, hyperthyroidism.
    """,

    # ── 8. GASTROINTESTINAL MEDICATIONS ─────────────────────
    """
    Gastrointestinal Medications:

    PROTON PUMP INHIBITORS (PPIs):
    - Omeprazole 20-40mg OD before breakfast → GERD, peptic ulcer, H. pylori eradication, NSAID protection
    - Pantoprazole 40mg OD → GERD, Zollinger-Ellison syndrome
    - Lansoprazole 30mg OD → GERD, peptic ulcer
    - Esomeprazole 20-40mg OD → GERD, maintenance
    Do's: Take 30-60 minutes before first meal. Most effective when taken consistently.
    Don'ts: Long-term use associated with hypomagnesemia, vitamin B12 deficiency, C. diff risk,
    increased fracture risk. Avoid unless clearly indicated.
    May reduce clopidogrel efficacy (use pantoprazole if needed with clopidogrel).

    H2 RECEPTOR ANTAGONISTS:
    - Ranitidine 150mg BD or 300mg QHS → GERD, peptic ulcer (now largely replaced by PPIs)
    - Famotidine 20mg BD → GERD, peptic ulcer

    ANTACIDS:
    - Magnesium trisilicate + Aluminium hydroxide mixture 10mL TDS → Symptomatic acidity
    - Gaviscon (alginate-antacid) 10-20mL after meals and at bedtime → GERD symptoms
    Don'ts: Antacids interfere with absorption of many drugs — take 2 hours apart.
    Magnesium-containing antacids cause diarrhea. Aluminium-containing cause constipation.

    ANTIEMETICS:
    - Ondansetron 4-8mg TDS PO/IV → Nausea/vomiting (chemotherapy, post-op, gastroenteritis)
    - Metoclopramide 10mg TDS PO/IV → Nausea, gastroparesis, GERD (short-term)
    - Domperidone 10mg TDS before meals → Nausea, gastroparesis, functional dyspepsia
    - Prochlorperazine 5-10mg TDS → Nausea, vertigo
    - Cyclizine 50mg TDS → Motion sickness, nausea
    Don'ts: Metoclopramide — avoid long-term (tardive dyskinesia). Avoid in Parkinson's.
    Ondansetron — QT prolongation risk, avoid in cardiac patients.

    LAXATIVES:
    - Lactulose 15-30mL BD → Constipation, hepatic encephalopathy
    - Bisacodyl 5-10mg OD at night → Constipation
    - Senna 15mg QHS → Constipation
    - Macrogol (Movicol) sachets OD-BD → Constipation, fecal impaction
    - Ispaghula husk (Metamucil) 1 sachet BD → Constipation, IBS
    Do's: Increase fluid and fiber intake alongside laxatives.
    Don'ts: Stimulant laxatives (bisacodyl, senna) — avoid long-term use (laxative dependence).

    ANTIDIARRHEALS:
    - Loperamide 4mg stat then 2mg after each loose stool (max 16mg/day) → Acute diarrhea
    - Oral rehydration salts (ORS) → Dehydration from diarrhea/vomiting
    Don'ts: Avoid loperamide in bloody diarrhea (dysentery), fever, or C. diff.

    H. PYLORI ERADICATION — TRIPLE THERAPY x14d:
    - Omeprazole 20mg BD + Amoxicillin 1g BD + Clarithromycin 500mg BD
    - If penicillin allergic: Omeprazole + Metronidazole 400mg BD + Clarithromycin 500mg BD
    Don'ts: Metronidazole regimen — absolutely no alcohol during and 48h after treatment.

    ANTISPASMODICS:
    - Hyoscine butylbromide (Buscopan) 10-20mg TDS PO → IBS, bowel spasm, dysmenorrhea
    - Mebeverine 135mg TDS before meals → IBS
    Don'ts: Avoid in glaucoma, prostatic hypertrophy, myasthenia gravis.
    """,

    # ── 9. ENDOCRINE / DIABETES MEDICATIONS ─────────────────
    """
    Endocrine and Diabetes Medications:

    BIGUANIDES:
    - Metformin 500-1000mg BD-TDS with meals → Type 2 DM first-line
    Do's: Take with food to reduce GI side effects. Regular HbA1c monitoring.
    Ensure adequate hydration.
    Don'ts: Hold 48 hours before and after IV contrast (lactic acidosis risk).
    Avoid in eGFR <30. Caution in liver failure, alcohol excess.
    Monitor B12 levels with long-term use.

    SULFONYLUREAS:
    - Glibenclamide 2.5-5mg OD before breakfast → T2DM
    - Glipizide 5-10mg OD → T2DM
    - Gliclazide 40-320mg OD-BD → T2DM (preferred in elderly — lower hypoglycemia risk)
    Do's: Take before meals. Carry glucose tablets for hypoglycemia.
    Don'ts: Risk of hypoglycemia — educate patient on symptoms (sweating, tremor, confusion).
    Avoid alcohol (potentiates hypoglycemia). Caution in renal impairment.

    DPP-4 INHIBITORS (Gliptins):
    - Sitagliptin 100mg OD → T2DM adjunct
    - Saxagliptin 5mg OD → T2DM adjunct
    - Vildagliptin 50mg BD → T2DM adjunct
    Do's: Can be taken with or without food. Low hypoglycemia risk.
    Don'ts: Caution in heart failure. Pancreatitis reported — stop if abdominal pain occurs.

    GLP-1 RECEPTOR AGONISTS:
    - Liraglutide (Victoza) 0.6-1.8mg SC OD → T2DM, obesity
    - Semaglutide (Ozempic) 0.25-1mg SC weekly → T2DM, CV risk reduction
    - Dulaglutide (Trulicity) 0.75-1.5mg SC weekly → T2DM
    Do's: Inject subcutaneously in abdomen, thigh, or upper arm. Rotate sites.
    Weight loss benefit. CV protective.
    Don'ts: Not for T1DM. Avoid in personal/family history of medullary thyroid carcinoma.
    Causes nausea initially — start low dose.

    SGLT-2 INHIBITORS:
    - Empagliflozin (Jardiance) 10-25mg OD → T2DM, heart failure, CKD
    - Dapagliflozin (Forxiga) 10mg OD → T2DM, heart failure, CKD
    - Canagliflozin (Invokana) 100-300mg OD → T2DM
    Do's: Good cardiovascular and renal protective effects. Can cause weight loss.
    Don'ts: Risk of urogenital infections (candidiasis, UTI) — genital hygiene important.
    Risk of DKA (diabetic ketoacidosis) — stop before major surgery.
    Avoid in eGFR <30. Risk of Fournier's gangrene (rare).

    INSULIN TYPES:
    - Rapid-acting: Insulin Aspart (NovoRapid), Lispro (Humalog) — onset 15min, peak 1h, duration 3-5h
      Inject 0-15 min before meals
    - Short-acting: Regular Insulin (Actrapid) — onset 30min, peak 2-4h, duration 6-8h
      Inject 30 min before meals
    - Intermediate: NPH Insulin (Insulatard) — onset 2h, peak 6-10h, duration 12-16h
    - Long-acting: Glargine (Lantus, Toujeo), Detemir (Levemir) — onset 2-4h, no peak, duration 24h
      Inject at same time each day
    - Premixed: 30/70 (30% regular + 70% NPH) — BD before meals
    Do's: Rotate injection sites within the same anatomical area. Store open vial at room temperature.
    Unopened insulin: refrigerate (2-8°C). Monitor blood glucose regularly.
    Always have fast-acting glucose available (glucose tablets, juice).
    Don'ts: Never inject into lipodystrophic areas. Don't shake insulin (roll gently).
    Don't reuse needles. Avoid alcohol on injection site.

    THYROID MEDICATIONS:
    - Levothyroxine (T4) 25-200mcg OD → Hypothyroidism
    Do's: Take on empty stomach 30-60 min before breakfast. Take at same time daily.
    Regular TSH monitoring (every 6-12 months when stable).
    Don'ts: Avoid calcium, iron supplements, antacids within 4 hours of dose.
    Many drug interactions. Never adjust dose without medical advice.

    - Carbimazole 5-20mg TDS initially → Hyperthyroidism (Graves' disease)
    - Propylthiouracil (PTU) 100-200mg TDS → Hyperthyroidism, pregnancy (first trimester)
    Don'ts: Stop immediately if sore throat/fever (risk of agranulocytosis — medical emergency).
    Regular FBC monitoring.

    CORTICOSTEROIDS (SYSTEMIC):
    - Prednisolone 5-60mg OD → Inflammatory conditions, autoimmune, allergic
    - Dexamethasone 0.5-10mg OD-QID → Anti-inflammatory, cerebral edema, antiemetic
    - Hydrocortisone 10-20mg BD (replacement dose) → Adrenal insufficiency
    Do's: Take with food. Take in morning to mimic diurnal cortisol rhythm.
    Carry steroid alert card if on long-term therapy.
    Don'ts: Never stop abruptly after >3 weeks use — adrenal crisis risk.
    Long-term effects: Cushing's syndrome, osteoporosis, hyperglycemia, cataracts,
    immunosuppression, skin thinning, weight gain.
    Take calcium and vitamin D with long-term use.
    """,

    # ── 10. PSYCHIATRY & NEUROLOGY MEDICATIONS ──────────────
    """
    Psychiatry and Neurology Medications:

    ANTIDEPRESSANTS — SSRIs (First-line for depression and anxiety):
    - Sertraline 50-200mg OD → Depression, PTSD, OCD, panic disorder, social anxiety
    - Fluoxetine 20-60mg OD (morning) → Depression, OCD, bulimia, PMDD
    - Escitalopram 10-20mg OD → Depression, GAD
    - Paroxetine 20-40mg OD → Depression, anxiety disorders, PTSD
    - Citalopram 20-40mg OD → Depression, panic disorder
    Do's: Takes 2-4 weeks for therapeutic effect. Continue for minimum 6 months after remission.
    Don'ts: QT prolongation with citalopram/escitalopram — ECG if high dose.
    Serotonin syndrome risk if combined with MAOIs, tramadol, triptans.
    Do not stop abruptly — discontinuation syndrome (dizziness, nausea, electric shock sensations).
    Increased suicidal ideation in children/young adults — monitor closely in first 4 weeks.

    SNRIs:
    - Venlafaxine 37.5-225mg OD → Depression, GAD, panic disorder, neuropathic pain
    - Duloxetine 30-60mg OD → Depression, GAD, neuropathic pain, fibromyalgia, stress incontinence
    Don'ts: Can raise blood pressure. Discontinuation syndrome worse than SSRIs.

    TRICYCLIC ANTIDEPRESSANTS (TCAs):
    - Amitriptyline 10-150mg QHS → Depression, neuropathic pain, migraine prophylaxis, IBS
    - Imipramine 25-150mg OD → Depression, enuresis
    Don'ts: Highly toxic in overdose (cardiac arrhythmias). Anticholinergic effects
    (dry mouth, constipation, urinary retention, blurred vision). Avoid in glaucoma, BPH.
    Sedating — avoid driving initially.

    ANTIPSYCHOTICS — First Generation (Typical):
    - Haloperidol 2-10mg BD-TDS → Schizophrenia, acute psychosis, delirium
    - Chlorpromazine 25-100mg TDS → Schizophrenia, severe anxiety (low dose)
    Don'ts: Extrapyramidal side effects (EPS): parkinsonism, acute dystonia, akathisia, tardive dyskinesia.
    Neuroleptic malignant syndrome (NMS) — rare but life-threatening (fever, rigidity, autonomic instability).

    ANTIPSYCHOTICS — Second Generation (Atypical):
    - Risperidone 2-8mg OD-BD → Schizophrenia, bipolar, irritability in autism
    - Olanzapine 5-20mg OD → Schizophrenia, bipolar mania
    - Quetiapine 25-750mg OD → Schizophrenia, bipolar, depression augmentation
    - Clozapine 150-450mg OD → Treatment-resistant schizophrenia
    - Aripiprazole 10-30mg OD → Schizophrenia, bipolar
    Don'ts: Metabolic syndrome risk — weight gain, diabetes, dyslipidemia. Regular metabolic monitoring.
    Clozapine: mandatory weekly/fortnightly FBC (agranulocytosis risk).
    QT prolongation risk.

    MOOD STABILIZERS:
    - Lithium carbonate 400-1200mg OD → Bipolar disorder, augmentation of antidepressants
      Therapeutic range: 0.6-1.0 mmol/L. Regular monitoring of serum levels, renal function, TFTs.
      Toxicity signs: tremor, ataxia, confusion, vomiting — EMERGENCY.
    - Sodium valproate 500-2000mg OD → Bipolar disorder, epilepsy
    - Carbamazepine 200-400mg BD → Bipolar, epilepsy, trigeminal neuralgia
    - Lamotrigine 25-200mg OD → Bipolar depression, epilepsy
    Don'ts: Valproate: ABSOLUTELY CONTRAINDICATED in women of childbearing age (teratogenic —
    spina bifida, autism risk). Requires PREVENT program enrollment.
    Carbamazepine: many drug interactions (enzyme inducer).

    ANXIOLYTICS / SEDATIVES:
    - Diazepam 2-10mg TDS → Anxiety (short-term), muscle spasm, alcohol withdrawal, seizures
    - Lorazepam 0.5-2mg BD → Anxiety, status epilepticus (IV), pre-procedure sedation
    - Clonazepam 0.5-2mg BD → Anxiety, epilepsy, panic disorder
    - Alprazolam 0.25-0.5mg TDS → Panic disorder, anxiety (high abuse potential)
    Do's: Use for shortest duration possible (maximum 4 weeks).
    Don'ts: High dependence and tolerance potential. Never combine with opioids or alcohol.
    Abrupt withdrawal can cause seizures — taper slowly.
    Avoid in elderly (fall risk), sleep apnea, liver disease.

    SLEEP AIDS:
    - Zolpidem 5-10mg QHS → Short-term insomnia
    - Zopiclone 3.75-7.5mg QHS → Short-term insomnia
    - Melatonin 2-5mg QHS → Jet lag, circadian rhythm disorders
    Don'ts: Zolpidem/zopiclone: avoid long-term. Sleep-walking, amnesia reported.
    Avoid in elderly. Dependence risk.

    ANTI-EPILEPTICS (AEDs):
    - Phenytoin 100-300mg OD → Epilepsy (tonic-clonic, focal seizures)
      Narrow therapeutic index — monitor levels (10-20 mcg/mL).
    - Carbamazepine 200-400mg BD → Focal seizures, generalized tonic-clonic
    - Sodium valproate 500-1000mg BD → All seizure types (avoid in women of childbearing age)
    - Levetiracetam 500-1500mg BD → Focal and generalized seizures (fewer interactions)
    - Lamotrigine 25-200mg OD → Focal and generalized seizures, bipolar
    - Topiramate 25-200mg BD → Focal seizures, migraine prophylaxis

    MIGRAINE TREATMENTS:
    - Sumatriptan 50-100mg PO or 6mg SC → Acute migraine (triptan)
    - Rizatriptan 10mg PO → Acute migraine
    - Propranolol 40-80mg BD → Migraine prophylaxis
    - Amitriptyline 10-25mg QHS → Migraine prophylaxis
    - Topiramate 25-100mg BD → Migraine prophylaxis
    Don'ts: Triptans — avoid in ischemic heart disease, uncontrolled hypertension, stroke history.
    Do not combine triptans with MAOIs or SSRIs (serotonin syndrome).

    DEMENTIA MEDICATIONS:
    - Donepezil 5-10mg OD → Alzheimer's disease (mild-moderate-severe)
    - Rivastigmine 1.5-6mg BD PO or patch → Alzheimer's, Parkinson's dementia
    - Galantamine 8-24mg OD → Mild-moderate Alzheimer's
    - Memantine 5-20mg OD → Moderate-severe Alzheimer's (NMDA antagonist)
    Do's: Take donepezil at night (reduces daytime nausea). Annual cognitive review.
    """,

    # ── 11. MUSCULOSKELETAL MEDICATIONS ─────────────────────
    """
    Musculoskeletal and Rheumatology Medications:

    DISEASE-MODIFYING ANTIRHEUMATIC DRUGS (DMARDs):
    - Methotrexate 7.5-25mg ONCE WEEKLY PO/SC → Rheumatoid arthritis, psoriasis
      WARNING: WEEKLY DOSE ONLY — daily dosing is FATAL. Orange/yellow tablets.
      Requires folic acid 5mg once weekly (on a different day) to reduce side effects.
      Regular monitoring: LFTs, FBC, renal function.
    - Hydroxychloroquine 200-400mg OD → RA, SLE, malaria prophylaxis
      Annual eye check (retinopathy risk with long-term use).
    - Sulfasalazine 500mg-1g BD → RA, inflammatory bowel disease
    - Leflunomide 10-20mg OD → RA
    Don'ts: Methotrexate: ABSOLUTELY CONTRAINDICATED in pregnancy, liver disease, significant alcohol use.
    Avoid live vaccines on methotrexate. Interacts with NSAIDs (toxicity risk).

    BIOLOGICS:
    - Adalimumab (Humira) SC every 2 weeks → RA, Crohn's, psoriasis, ankylosing spondylitis
    - Etanercept (Enbrel) SC weekly → RA, psoriasis, ankylosing spondylitis
    - Infliximab IV every 6-8 weeks → RA, IBD, psoriasis
    Don'ts: Screen for TB and hepatitis B before starting anti-TNF biologics.
    Avoid live vaccines. Increased infection risk. Do not use in heart failure (moderate-severe).

    GOUT MEDICATIONS:
    - Colchicine 500mcg BD-TDS → Acute gout (within 24-36 hours of attack)
    - Indomethacin 50mg TDS x5d → Acute gout
    - Allopurinol 100-300mg OD → Chronic gout prevention (do NOT start during acute attack)
    - Febuxostat 40-80mg OD → Chronic gout (if allopurinol intolerant)
    Do's: During acute gout — rest, elevate joint, ice packs. Increase fluid intake.
    Don'ts: Avoid high-purine foods (red meat, offal, shellfish, beer). Limit alcohol.
    Do not start allopurinol during acute attack (worsens attack).
    Allopurinol — rare severe skin reaction (Stevens-Johnson syndrome) — stop if rash develops.

    OSTEOPOROSIS MEDICATIONS:
    - Alendronate 70mg ONCE WEEKLY PO → Osteoporosis prevention/treatment
    - Risedronate 35mg ONCE WEEKLY PO → Osteoporosis
    - Calcium 500mg + Vitamin D 400IU BD → Calcium and vitamin D supplementation
    - Denosumab 60mg SC every 6 months → Osteoporosis
    Do's: Take bisphosphonates with full glass of water. Remain upright for 30 minutes after.
    Take on empty stomach 30 minutes before first food/drink.
    Don'ts: Avoid lying down after bisphosphonates (esophageal ulceration).
    Osteonecrosis of the jaw with long-term use — dental check before starting.

    MUSCLE RELAXANTS:
    - Baclofen 5-25mg TDS → Muscle spasm, spasticity (MS, spinal cord injury)
    - Cyclobenzaprine 5-10mg TDS → Acute muscle spasm
    - Orphenadrine 100mg BD → Muscle spasm, Parkinson's
    Don'ts: Avoid alcohol and CNS depressants. Causes drowsiness — avoid driving.
    Do not stop baclofen abruptly (withdrawal seizures).
    """,

    # ── 12. INFECTIOUS DISEASES & ANTIMALARIALS ─────────────
    """
    Infectious Diseases and Tropical Medicine:

    ANTIFUNGALS:
    - Fluconazole 150mg single dose → Vaginal candidiasis
    - Fluconazole 50-400mg OD x7-14d → Systemic candidiasis, cryptococcal meningitis
    - Itraconazole 100-200mg BD → Onychomycosis, systemic fungal infections
    - Clotrimazole cream/pessary → Topical fungal infections, vaginal thrush
    - Nystatin suspension 100,000 units QID → Oral candidiasis (thrush)
    Don'ts: Fluconazole: many drug interactions (inhibits CYP3A4 and CYP2C9).
    Significant interaction with warfarin, statins, antiepileptics.

    ANTIVIRALS:
    - Acyclovir 200-800mg 5x/day x5-10d → Herpes simplex, varicella-zoster
    - Valacyclovir 500-1000mg BD → Herpes (better bioavailability than acyclovir)
    - Oseltamivir (Tamiflu) 75mg BD x5d → Influenza (start within 48 hours)
    - Tenofovir + Emtricitabine (Truvada) → HIV, Hepatitis B, PrEP
    Don'ts: Acyclovir: adequate hydration essential (renal tubular crystallization).

    ANTIMALARIALS:
    - Artemether-Lumefantrine (Coartem) 80/480mg BD x3d → P. falciparum malaria
    - Artesunate IV → Severe malaria
    - Chloroquine phosphate 500mg weekly → Malaria prophylaxis (where sensitive)
    - Hydroxychloroquine 400mg weekly → Malaria prophylaxis
    - Doxycycline 100mg OD → Malaria prophylaxis (start 2d before travel, continue 4 weeks after)
    - Mefloquine 250mg weekly → Malaria prophylaxis
    Don'ts: Mefloquine: avoid in psychiatric disorders, seizure history.
    Chloroquine: avoid in G6PD deficiency, retinal disease.

    ANTIPARASITIC:
    - Albendazole 400mg single dose → Intestinal helminths, hookworm, roundworm
    - Mebendazole 100mg BD x3d → Intestinal helminths
    - Ivermectin 200mcg/kg single dose → Strongyloidiasis, onchocerciasis, scabies
    - Praziquantel 40mg/kg single dose → Schistosomiasis, tapeworm
    - Metronidazole 400mg TDS x7d → Giardia, amoeba, trichomonas

    ANTIRETROVIRALS (HIV):
    First-line regimen: Tenofovir + Lamivudine + Dolutegravir (TLD) OD
    - Tenofovir (TDF/TAF): monitor renal function, bone density
    - Lamivudine (3TC): minimal side effects
    - Dolutegravir: excellent efficacy, high barrier to resistance
    - Efavirenz: CNS side effects (vivid dreams, dizziness) — take at bedtime
    Don'ts: Never miss doses (resistance develops). Many drug interactions.
    Contraception essential (drug interactions with hormonal contraceptives).
    """,

    # ── 13. OBSTETRICS & GYNAECOLOGY ────────────────────────
    """
    Obstetrics, Gynaecology and Reproductive Health Medications:

    CONTRACEPTION:
    Combined Oral Contraceptive Pill (COCP):
    - Microgynon 30 (Ethinylestradiol 30mcg + Levonorgestrel 150mcg) OD x21d then 7d break
    - Yasmin (Ethinylestradiol 30mcg + Drospirenone 3mg) OD
    Do's: Take at same time daily. Use backup method for first 7 days.
    Don'ts: Avoid in smokers >35 years (VTE risk), migraine with aura, personal history of VTE,
    hypertension, liver disease, breast cancer.
    Efficacy reduced by enzyme-inducing drugs (rifampicin, carbamazepine, St John's Wort).

    Progestogen-Only Pill (POP / Mini-pill):
    - Cerazette (Desogestrel 75mcg) OD continuously → Safe in breastfeeding, hypertension
    Do's: Take within 12-hour window each day. Can cause irregular bleeding.

    Emergency Contraception:
    - Levonorgestrel 1.5mg (Plan B / Postinor) single dose → Within 72 hours of unprotected sex
    - Ulipristal acetate 30mg (ellaOne) → Within 120 hours (more effective than levonorgestrel)
    - Copper IUD → Within 120 hours (most effective)
    Don'ts: Morning-after pill is not for regular use. Does not protect against STIs.

    UTEROTONICS:
    - Oxytocin 10 units IM/IV → Induction of labor, postpartum hemorrhage (PPH) prevention
    - Ergometrine 500mcg IM → PPH treatment
    - Misoprostol 400-600mcg → Induction of labor, PPH, medical abortion

    TOCOLYTICS (preterm labor):
    - Nifedipine 20mg loading then 10-20mg QID → Preterm labor
    - Atosiban IV → Preterm labor (oxytocin antagonist)

    ANTENATAL SUPPLEMENTS:
    - Folic acid 400mcg OD → From preconception to 12 weeks (neural tube defect prevention)
    - Folic acid 5mg OD → High-risk women (previous NTD, epilepsy, BMI >30, diabetes)
    - Iron 200mg TDS → Iron deficiency anemia in pregnancy
    - Vitamin D 10mcg (400 IU) OD → Throughout pregnancy and breastfeeding

    DRUGS CONTRAINDICATED IN PREGNANCY:
    - ACE inhibitors / ARBs (renal agenesis, fetal death)
    - Warfarin first trimester (embryopathy), third trimester (hemorrhage)
    - Tetracyclines (skeletal/dental effects)
    - Methotrexate, leflunomide, mycophenolate (teratogenic)
    - NSAIDs in third trimester (premature closure of ductus arteriosus)
    - Valproate (neural tube defects, developmental delay, autism)
    - Statins
    - Fluoroquinolones
    - Thalidomide (limb defects)
    - Live vaccines (MMR, varicella, yellow fever)

    SAFE DRUGS IN PREGNANCY:
    - Paracetamol (all trimesters — short term)
    - Penicillins, cephalosporins, erythromycin, azithromycin
    - Heparin, LMWH (does not cross placenta)
    - Metformin, insulin
    - Methyldopa, labetalol, nifedipine (hypertension in pregnancy)
    - Hydrocortisone, prednisolone (lowest effective dose)
    """,

    # ── 14. PAEDIATRIC MEDICATIONS ──────────────────────────
    """
    Paediatric Medications — Weight-Based Dosing:

    ANALGESICS/ANTIPYRETICS:
    - Paracetamol 15mg/kg/dose QID PRN → Pain, fever (max 60mg/kg/day)
    - Ibuprofen 5-10mg/kg/dose TDS with food → Pain, fever, inflammation (>3 months, >5kg)
    Don'ts: NEVER give Aspirin to children <16 years (Reye's syndrome risk).
    Ibuprofen — avoid in dehydrated children, <3 months.

    ANTIBIOTICS (PAEDIATRIC):
    - Amoxicillin 25-40mg/kg/day in 3 divided doses → Common infections
    - Co-amoxiclav 25-45mg/kg/day BD → Resistant infections
    - Azithromycin 10mg/kg OD x3d → Atypical pneumonia, pertussis
    - Cefalexin 25-50mg/kg/day QID → Skin, UTI

    RESPIRATORY (PAEDIATRIC):
    - Salbutamol 100mcg MDI 2-6 puffs via spacer PRN → Acute asthma (all ages)
    - Prednisolone 1-2mg/kg/day OD x3d → Acute asthma exacerbation
    - Budesonide inhaler 100-200mcg BD → Persistent asthma maintenance

    SEIZURES (PAEDIATRIC):
    - Diazepam rectal 0.5mg/kg → Acute seizure/status epilepticus
    - Midazolam buccal 0.2mg/kg → Acute seizure (preferred route in community)
    - Phenobarbital IV 20mg/kg → Status epilepticus (neonates, refractory)

    REHYDRATION:
    - ORS (oral rehydration salts) → First-line for mild-moderate dehydration in gastroenteritis
    - Normal saline 0.9% 20mL/kg bolus IV → Severe dehydration/shock

    VACCINATIONS (STANDARD SCHEDULE):
    Birth: BCG, Hepatitis B (0)
    6 weeks: DTP-HepB-Hib + IPV + PCV + Rotavirus
    10 weeks: DTP-HepB-Hib + IPV + PCV + Rotavirus
    14 weeks: DTP-HepB-Hib + IPV + PCV + Rotavirus + OPV
    9 months: Measles/MMR, Yellow fever (endemic areas)
    12-15 months: MMR booster
    18 months: DTP booster
    4-6 years: DTP + IPV + MMR booster
    """,

    # ── 15. VITAL SIGNS & NORMAL RANGES ─────────────────────
    """
    Normal Vital Signs and Laboratory Reference Ranges:

    VITAL SIGNS BY AGE:
    Blood Pressure (adults): Normal <120/80 mmHg
    - Elevated: 120-129/<80 mmHg
    - Stage 1 HTN: 130-139/80-89 mmHg
    - Stage 2 HTN: ≥140/≥90 mmHg
    - Hypertensive crisis: >180/>120 mmHg
    - Hypotension: <90/60 mmHg

    Heart Rate: Adults 60-100 bpm | Children 80-120 bpm | Infants 100-160 bpm
    Bradycardia: <60 bpm | Tachycardia: >100 bpm

    Respiratory Rate: Adults 12-20/min | Children 20-30/min | Infants 30-60/min
    Tachypnea: >20 (adults), >30 (children)

    Temperature: 36.1-37.2°C | Fever: >38°C | Hypothermia: <35°C | Hyperpyrexia: >40°C

    SpO2: ≥95% normal | 90-94% mild hypoxia | <90% severe hypoxia — supplemental O2 required

    BMI Classification:
    <18.5 = Underweight | 18.5-24.9 = Normal | 25-29.9 = Overweight
    30-34.9 = Obese Class I | 35-39.9 = Obese Class II | ≥40 = Obese Class III (morbid)

    LABORATORY REFERENCE RANGES (Adults):
    Full Blood Count (FBC):
    - Hb: M 130-170g/L, F 120-160g/L
    - WBC: 4.0-11.0 × 10⁹/L
    - Platelets: 150-400 × 10⁹/L
    - MCV: 80-100 fL | MCH: 27-33 pg

    Biochemistry:
    - Sodium: 135-145 mmol/L
    - Potassium: 3.5-5.0 mmol/L
    - Creatinine: M 62-115 μmol/L, F 44-97 μmol/L
    - eGFR: >60 mL/min/1.73m² (normal)
    - Urea: 2.5-7.1 mmol/L
    - Glucose (fasting): 3.9-5.6 mmol/L
    - HbA1c: <48 mmol/mol (<6.5%) normal; >48 mmol/mol (>6.5%) diabetic
    - Total Cholesterol: <5.0 mmol/L
    - LDL: <3.0 mmol/L (high risk: <1.8 mmol/L)
    - HDL: M >1.0 mmol/L, F >1.2 mmol/L
    - Triglycerides: <1.7 mmol/L
    - ALT: 7-40 U/L | AST: 10-40 U/L | ALP: 44-147 U/L
    - Bilirubin (total): <21 μmol/L
    - Albumin: 35-50 g/L | Total Protein: 60-80 g/L
    - Calcium: 2.2-2.6 mmol/L | Phosphate: 0.8-1.5 mmol/L
    - Magnesium: 0.7-1.0 mmol/L
    - TSH: 0.4-4.0 mIU/L | Free T4: 9-23 pmol/L
    - CRP: <10 mg/L (normal) | ESR: M <20mm/hr, F <30mm/hr
    - Uric acid: M 200-430 μmol/L, F 140-360 μmol/L
    - PSA: <4 ng/mL (age-dependent)

    Coagulation:
    - INR: 0.8-1.2 (therapeutic 2.0-3.0 for anticoagulation)
    - PT: 11-14 seconds | APTT: 25-35 seconds

    Urine:
    - pH 4.6-8.0 | Specific gravity 1.005-1.030
    - Normal: no protein, no glucose, no blood, no nitrites, no leucocytes
    """,

    # ── 16. ICD-10 CODES — COMPREHENSIVE ────────────────────
    """
    ICD-10 Diagnostic Codes — Expanded Reference:

    CARDIOVASCULAR (I):
    I10 - Essential (primary) hypertension
    I11.0 - Hypertensive heart disease with heart failure
    I20.0 - Unstable angina
    I20.9 - Angina pectoris, unspecified
    I21.0 - Anterior STEMI
    I21.1 - Inferior STEMI
    I21.4 - NSTEMI
    I22 - Subsequent myocardial infarction
    I25.10 - Atherosclerotic heart disease, unspecified
    I26.99 - Pulmonary embolism
    I48.0 - Paroxysmal atrial fibrillation
    I48.1 - Persistent AF
    I48.2 - Chronic AF
    I50.0 - Congestive heart failure
    I50.9 - Heart failure, unspecified
    I63.9 - Cerebral infarction (ischemic stroke), unspecified
    I64 - Stroke, not specified as hemorrhage or infarction
    I70.0 - Atherosclerosis of aorta
    I73.9 - Peripheral vascular disease, unspecified
    I80.2 - DVT of leg, unspecified
    I83.9 - Varicose veins of lower extremities

    RESPIRATORY (J):
    J00 - Acute nasopharyngitis (common cold)
    J01.90 - Acute sinusitis, unspecified
    J02.9 - Acute pharyngitis, unspecified
    J03.90 - Acute tonsillitis, unspecified
    J06.9 - Acute URTI, unspecified
    J10.0 - Influenza with pneumonia, seasonal
    J12.9 - Viral pneumonia, unspecified
    J15.9 - Bacterial pneumonia, unspecified
    J18.9 - Pneumonia, unspecified
    J20.9 - Acute bronchitis, unspecified
    J22 - Acute LRTI, unspecified
    J30.1 - Allergic rhinitis due to pollen
    J44.0 - COPD with acute lower respiratory infection
    J44.1 - COPD with acute exacerbation
    J45.20 - Mild intermittent asthma, uncomplicated
    J45.40 - Moderate persistent asthma, uncomplicated
    J45.50 - Severe persistent asthma, uncomplicated
    J96.00 - Acute respiratory failure

    ENDOCRINE (E):
    E03.9 - Hypothyroidism, unspecified
    E05.0 - Thyrotoxicosis with diffuse goitre (Graves')
    E10.9 - Type 1 diabetes without complications
    E11.9 - Type 2 diabetes without complications
    E11.40 - T2DM with diabetic neuropathy
    E11.65 - T2DM with hyperglycemia
    E66.9 - Obesity, unspecified
    E78.00 - Pure hypercholesterolemia
    E78.5 - Hyperlipidemia, unspecified
    E83.51 - Hypocalcemia
    E86.0 - Dehydration

    MUSCULOSKELETAL (M):
    M06.9 - Rheumatoid arthritis, unspecified
    M10.9 - Gout, unspecified
    M15.9 - Polyosteoarthritis, unspecified
    M16.9 - Hip osteoarthritis, unspecified
    M17.9 - Knee osteoarthritis, unspecified
    M19.90 - Osteoarthritis, unspecified site
    M48.06 - Spinal stenosis, lumbar region
    M54.2 - Cervicalgia (neck pain)
    M54.4 - Lumbago with sciatica
    M54.5 - Low back pain
    M79.3 - Panniculitis
    M81.0 - Age-related osteoporosis

    GASTROINTESTINAL (K):
    K21.0 - GERD with esophagitis
    K21.9 - GERD without esophagitis
    K25.9 - Gastric ulcer, unspecified
    K26.9 - Duodenal ulcer, unspecified
    K29.70 - Gastritis, unspecified
    K35.80 - Acute appendicitis
    K57.30 - Diverticulosis of large intestine
    K58.9 - Irritable bowel syndrome, unspecified
    K70.30 - Alcoholic cirrhosis without ascites
    K80.20 - Cholelithiasis (gallstones)
    K92.1 - Melena

    GENITOURINARY (N):
    N18.3 - CKD stage 3
    N20.0 - Nephrolithiasis (kidney stones)
    N30.00 - Acute cystitis
    N39.0 - Urinary tract infection, site not specified
    N40.1 - BPH with LUTS
    N94.6 - Dysmenorrhea, unspecified
    N95.1 - Postmenopausal atrophic vaginitis

    MENTAL HEALTH (F):
    F10.10 - Alcohol use disorder, mild
    F17.210 - Nicotine dependence, cigarettes
    F20.9 - Schizophrenia, unspecified
    F31.9 - Bipolar disorder, unspecified
    F32.9 - Major depressive disorder, single episode
    F33.9 - Major depressive disorder, recurrent
    F40.10 - Social phobia
    F41.0 - Panic disorder
    F41.1 - Generalized anxiety disorder
    F42.9 - OCD, unspecified
    F43.10 - PTSD
    F50.00 - Anorexia nervosa
    F51.01 - Primary insomnia

    NEUROLOGICAL (G):
    G20 - Parkinson's disease
    G30.9 - Alzheimer's disease, unspecified
    G35 - Multiple sclerosis
    G40.909 - Epilepsy, unspecified
    G43.909 - Migraine, unspecified
    G47.00 - Insomnia, unspecified
    G47.33 - Obstructive sleep apnea
    G62.9 - Peripheral neuropathy, unspecified
    G89.29 - Chronic pain syndrome

    INFECTIONS (A/B):
    A09 - Diarrhea and gastroenteritis of presumed infectious origin
    A41.9 - Sepsis, unspecified organism
    B24 - HIV disease
    B35.1 - Tinea unguium (onychomycosis)
    B37.0 - Oral candidiasis
    """,

    # ── 17. EMERGENCY MEDICINE ───────────────────────────────
    """
    Emergency Medicine — Acute Presentations and Management:

    ACUTE CORONARY SYNDROME (ACS) — STEMI/NSTEMI/Unstable Angina:
    Symptoms: Chest pain (crushing, radiating to jaw/left arm), diaphoresis, dyspnea, nausea
    Immediate management (MONA):
    - Morphine 2-4mg IV (pain relief)
    - Oxygen if SpO2 <94%
    - Nitrates: GTN SL if SBP >90mmHg
    - Aspirin 300mg stat (chewed) + Clopidogrel 300mg loading dose
    - ECG within 10 minutes
    - STEMI: Immediate PCI (door-to-balloon <90 min) or thrombolysis if PCI unavailable
    - Anticoagulation: Heparin or enoxaparin

    HYPERTENSIVE EMERGENCY (BP >180/120 + end organ damage):
    - Labetalol IV 20mg over 2 minutes
    - Sodium nitroprusside IV infusion
    - Goal: reduce MAP by 20-25% in first hour (not too fast — risk of ischemia)

    ANAPHYLAXIS:
    - Adrenaline (Epinephrine) 0.5mg IM (1:1000) anterolateral thigh — FIRST LINE
    - Repeat after 5 minutes if no improvement
    - Chlorphenamine 10mg IV + Hydrocortisone 200mg IV
    - IV fluids if hypotensive
    - Keep patient supine, legs elevated
    - Monitor for biphasic reaction (6-12 hours observation)

    DIABETIC KETOACIDOSIS (DKA):
    Criteria: Glucose >11 mmol/L, pH <7.3, bicarbonate <15, ketones >3 mmol/L
    Management:
    - IV fluid resuscitation: 0.9% NaCl 1L over first hour
    - Fixed-rate insulin infusion 0.1 units/kg/hour
    - Potassium replacement (monitor closely — insulin drives K into cells)
    - Monitor glucose hourly, electrolytes 2-4 hourly
    - Add dextrose when glucose <14 mmol/L (to continue insulin)

    HYPOGLYCEMIA (Glucose <3.9 mmol/L):
    Conscious patient: 15-20g fast-acting carbs (glucose tablets, fruit juice)
    Unconscious: Dextrose 50% 25-50mL IV, or Glucagon 1mg IM/SC
    Recheck glucose after 15 minutes. Give complex carbs after recovery.

    STATUS EPILEPTICUS (Seizure >5 min or 2 seizures without recovery):
    - Benzodiazepine first: Lorazepam 4mg IV or Midazolam 10mg buccal/IM
    - Second line (if no IV): Levetiracetam 60mg/kg IV or Phenytoin 20mg/kg IV
    - Third line: Phenobarbital 20mg/kg IV
    - Refractory: Thiopental/propofol infusion (ICU, intubation)

    STROKE (FAST: Face drooping, Arm weakness, Speech difficulty, Time to call):
    - CT head immediately to exclude hemorrhage
    - Ischemic stroke within 4.5 hours: Alteplase 0.9mg/kg IV thrombolysis
    - Mechanical thrombectomy if large vessel occlusion within 24 hours
    - Aspirin 300mg (only after hemorrhage excluded)
    - Target BP <180/105 in acute phase

    PULMONARY EMBOLISM (PE):
    Wells score criteria, D-dimer, CTPA
    - Anticoagulation: LMWH (Enoxaparin 1mg/kg BD) or NOAC (Rivaroxaban 15mg BD x21d)
    - Massive PE (hemodynamically unstable): Systemic thrombolysis (Alteplase 100mg IV)
    - Anticoagulation for 3-6 months (provoked) or indefinitely (unprovoked/recurrent)

    SEPSIS (qSOFA: RR >22, Altered mentation, SBP ≤100):
    Sepsis Six (within 1 hour):
    1. High-flow oxygen
    2. Blood cultures x2
    3. IV antibiotics (broad-spectrum: Piperacillin-tazobactam or Meropenem)
    4. IV fluid resuscitation 30mL/kg crystalloid
    5. Lactate measurement
    6. Urine output monitoring (catheter)
    """,

    # ── 18. DRUG INTERACTIONS ────────────────────────────────
    """
    Clinically Significant Drug Interactions:

    WARFARIN INTERACTIONS (potentiates anticoagulation — bleeding risk):
    + Aspirin/NSAIDs → Increased bleeding
    + Antibiotics (metronidazole, ciprofloxacin, fluconazole) → Increased INR
    + Amiodarone → Markedly increased INR
    + Simvastatin (at high doses) → Increased INR
    Reduces INR: Rifampicin, carbamazepine, phenytoin (enzyme inducers)

    SEROTONIN SYNDROME (combination of serotonergic drugs):
    SSRIs + MAOIs → FATAL — contraindicated (washout period required)
    SSRIs + Tramadol → Increased risk
    SSRIs + Triptans → Increased risk
    SSRIs + Linezolid → Increased risk

    QT PROLONGATION (additive effect):
    - Ciprofloxacin + Ondansetron → Avoid
    - Amiodarone + any QT-prolonging drug
    - Antipsychotics + macrolides
    - Citalopram + any QT drug

    NEPHROTOXIC COMBINATIONS (avoid concurrent use):
    - NSAIDs + ACE inhibitors + Diuretics → "Triple whammy" — acute kidney injury
    - Aminoglycosides + vancomycin → Additive nephrotoxicity
    - NSAIDs + cyclosporine → Nephrotoxicity

    STATINS:
    - Simvastatin/atorvastatin + Clarithromycin/erythromycin → Rhabdomyolysis risk
    - Simvastatin/atorvastatin + Itraconazole/fluconazole → Rhabdomyolysis
    - Simvastatin/atorvastatin + Grapefruit juice → Increased statin levels
    Preferred statin with interactions: Pravastatin or Rosuvastatin (fewer CYP3A4 interactions)

    ANTIEPILEPTIC INTERACTIONS (enzyme inducers):
    Carbamazepine, Phenytoin, Phenobarbital, Rifampicin reduce levels of:
    - Oral contraceptives (contraception failure)
    - Warfarin (reduced anticoagulation)
    - HIV antiretrovirals
    - Corticosteroids
    - Many other drugs

    METHOTREXATE TOXICITY RISK:
    + NSAIDs → Reduced renal excretion → Toxicity
    + Penicillins → Reduced excretion
    + Trimethoprim → Additive antifolate effect → Severe toxicity

    DIGOXIN TOXICITY:
    + Amiodarone, verapamil, diltiazem → Increase digoxin levels → Toxicity
    + Hypokalemia (diuretics) → Sensitizes heart to digoxin toxicity

    FOOD-DRUG INTERACTIONS:
    - Grapefruit: increases levels of statins, CCBs, immunosuppressants, benzodiazepines
    - Vitamin K (leafy greens): reduces warfarin effect
    - Dairy/antacids/iron: reduces absorption of fluoroquinolones, tetracyclines, levothyroxine
    - Tyramine-rich foods + MAOIs → Hypertensive crisis (cheese, red wine, cured meats)
    - Alcohol + metronidazole/tinidazole → Disulfiram reaction
    - Alcohol + metformin → Lactic acidosis risk
    - Alcohol + benzodiazepines/opioids → CNS/respiratory depression
    """,

    # ── 19. CLINICAL RISK SCORES ─────────────────────────────
    """
    Clinical Risk Assessment Tools and Scoring Systems:

    CARDIOVASCULAR:
    CHA₂DS₂-VASc Score (AF stroke risk — anticoagulation threshold):
    - CHF (1pt), Hypertension (1pt), Age ≥75 (2pts), Diabetes (1pt)
    - Stroke/TIA history (2pts), Vascular disease (1pt), Age 65-74 (1pt), Sex (Female 1pt)
    Score ≥2 men / ≥3 women → anticoagulation recommended
    Score 1 man / 2 women → consider anticoagulation

    HAS-BLED Score (bleeding risk on anticoagulation):
    - Hypertension, Abnormal renal/liver function, Stroke history, Bleeding history
    - Labile INR, Elderly (>65), Drugs (NSAIDs/antiplatelets/alcohol)
    Score ≥3 = high bleeding risk

    GRACE Score → Risk stratification in ACS (in-hospital/6-month mortality)
    TIMI Score → Risk stratification STEMI/NSTEMI

    RESPIRATORY:
    CURB-65 (Community-acquired pneumonia severity):
    - Confusion (new), Urea >7mmol/L, RR ≥30, BP <90/60, Age ≥65
    - Score 0-1: Low risk (outpatient treatment)
    - Score 2: Moderate (consider admission)
    - Score 3-5: High (hospital, consider ICU)

    PSI/PORT Score → More detailed CAP severity scoring

    WELLS SCORE for DVT:
    - Active cancer (1), Paralysis/immobilization (1), Bedridden >3 days/surgery in 4 weeks (1)
    - Localized tenderness (1), Entire leg swollen (1), Calf swelling >3cm (1)
    - Pitting edema (1), Collateral superficial veins (1), Alternative diagnosis as likely (-2)
    Score ≥2: High probability → CTPA/Doppler ultrasound

    WELLS SCORE for PE:
    DVT signs (3), Alternative diagnosis less likely (3), HR >100 (1.5), Immobilization (1.5),
    Previous DVT/PE (1.5), Hemoptysis (1), Malignancy (1)
    Score >4: PE likely → CTPA

    GASTROENTEROLOGY:
    Glasgow-Blatchford Score (upper GI bleeding — need for intervention):
    Factors: BUN, Hb, SBP, HR, melena, syncope, hepatic disease, heart failure
    Score 0: Low risk, may be discharged for outpatient endoscopy

    Child-Pugh Score (liver cirrhosis severity): A (5-6pts) B (7-9pts) C (10-15pts)
    MELD Score → Liver transplant priority

    NEUROLOGY:
    NIHSS (NIH Stroke Scale) → Stroke severity (0=no deficit, >20=severe)
    Glasgow Coma Scale (GCS): Eyes (1-4) + Verbal (1-5) + Motor (1-6) = 3-15
    - GCS <8: Severe head injury, intubation threshold

    SEPSIS:
    qSOFA (quick SOFA): RR >22, Altered mentation, SBP ≤100 → ≥2 = suspect sepsis
    SOFA Score → Full organ failure assessment in ICU

    OBSTETRICS:
    Bishop Score → Cervical favorability for induction
    Modified Early Obstetric Warning Score (MEOWS) → Maternal deterioration
    """,

    # ── 20. PATIENT COUNSELLING & LIFESTYLE ─────────────────
    """
    Patient Education and Lifestyle Counselling:

    HYPERTENSION LIFESTYLE ADVICE:
    Do's:
    - DASH diet: rich in fruits, vegetables, whole grains, low-fat dairy, lean protein
    - Reduce sodium intake to <2.3g/day (about 1 teaspoon)
    - Regular aerobic exercise: 150 min/week moderate intensity
    - Maintain healthy weight (BMI 18.5-24.9)
    - Limit alcohol: men <14 units/week, women <7 units/week
    - Regular BP monitoring at home
    Don'ts:
    - Avoid excess salt, processed foods, fast food
    - Avoid smoking — immediate cessation advised
    - Avoid excess caffeine
    - Do not stop antihypertensive medications without consulting doctor

    DIABETES (TYPE 2) LIFESTYLE ADVICE:
    Do's:
    - Low glycemic index diet: whole grains, legumes, non-starchy vegetables
    - Regular physical activity: 150 min/week (improves insulin sensitivity)
    - Self-monitoring of blood glucose as advised
    - Foot care: daily inspection, moisturize, comfortable footwear
    - Annual eye, kidney, and nerve checks
    - HbA1c check every 3-6 months
    - Dental hygiene (diabetes increases gum disease risk)
    Don'ts:
    - Avoid sugary drinks, refined carbohydrates, excessive fruit juices
    - Avoid smoking (dramatically worsens vascular complications)
    - Avoid going barefoot (neuropathy reduces sensation — injury risk)
    - Never skip meals if on insulin or sulfonylureas (hypoglycemia risk)

    ASTHMA PATIENT EDUCATION:
    Do's:
    - Use reliever (blue/salbutamol) inhaler for symptoms
    - Use preventer (brown/ICS) inhaler daily even when well
    - Use spacer device for metered-dose inhalers
    - Know your personal action plan (green/yellow/red zones)
    - Identify and avoid triggers (allergens, smoke, cold air, exercise, NSAIDs)
    - Annual influenza vaccination
    Don'ts:
    - Never stop preventer inhaler because you feel well
    - Don't use reliever >3x/week without medical review
    - Avoid smoking and secondhand smoke
    - Avoid NSAIDs if aspirin-sensitive asthma

    CARDIAC REHABILITATION / POST-MI ADVICE:
    Do's:
    - Cardiac rehab program attendance
    - Gradual return to activity — start with walking
    - Mediterranean diet: olive oil, fish, vegetables, nuts
    - Regular low-dose aspirin and other medications as prescribed
    - Stop smoking — single most important modifiable risk factor
    Don'ts:
    - Avoid heavy lifting or strenuous activity initially
    - No driving for minimum 4 weeks post-MI (or as per local guidelines)
    - Avoid high-fat, high-cholesterol, processed foods
    - No alcohol for at least 1 week post-MI; then only moderate

    SMOKING CESSATION:
    - Nicotine replacement therapy (NRT): patches 24hr or 16hr, gum, inhaler, lozenge, nasal spray
    - Varenicline (Champix/Chantix) 0.5mg OD x3d then 0.5mg BD x4d then 1mg BD x12 weeks
      Most effective pharmacotherapy. Monitor for mood changes/suicidality.
    - Bupropion (Wellbutrin/Zyban) 150mg OD x3d then 150mg BD x7-12 weeks
    - Brief advice: "5 A's" — Ask, Advise, Assess, Assist, Arrange
    - Combination NRT (patch + short-acting) more effective than single NRT

    ALCOHOL REDUCTION / CESSATION:
    Safe limits: Men <14 units/week, Women <7 units/week, with 2-3 alcohol-free days
    1 unit = 250mL beer (4%), 25mL spirits, 76mL wine
    Alcohol withdrawal (heavy users): Chlordiazepoxide reducing regimen over 5-7 days
    CIWA-Ar score for withdrawal severity
    Thiamine (Pvitamins) before glucose in alcohol-dependent patients (Wernicke's encephalopathy prevention)

    MENTAL HEALTH SELF-CARE:
    Do's:
    - Regular sleep schedule (7-9 hours)
    - Regular physical exercise (reduces depression/anxiety as effectively as medication in mild-moderate)
    - Social connection and support networks
    - Mindfulness-based stress reduction (MBSR)
    - Cognitive Behavioral Therapy (CBT) — first-line for depression, anxiety, OCD, PTSD
    - Limit social media if causing distress
    Don'ts:
    - Avoid alcohol and recreational drugs (worsen mental health)
    - Don't isolate — social withdrawal worsens depression
    - Don't stop medications abruptly

    WEIGHT MANAGEMENT:
    - 500 calorie deficit/day → ~0.5kg/week weight loss (safe and sustainable)
    - Caloric needs: Harris-Benedict equation
    - Orlistat 120mg TDS with meals → Weight loss medication (inhibits fat absorption)
    - GLP-1 agonists (Semaglutide Wegovy 2.4mg weekly SC) → Significant weight loss
    - Bariatric surgery: BMI ≥40, or ≥35 with comorbidities
    """,

    # ── 21. CLINICAL EXAMINATION FINDINGS ───────────────────
    """
    Clinical Examination Findings and Interpretation:

    CARDIOVASCULAR EXAMINATION:
    Pulse: Rate, rhythm (regular/irregular), volume (normal/bounding/weak), character
    - Collapsing pulse → Aortic regurgitation
    - Slow rising pulse → Aortic stenosis
    - Irregularly irregular → Atrial fibrillation
    - Pulsus paradoxus (>10mmHg drop on inspiration) → Cardiac tamponade, severe asthma

    JVP (Jugular Venous Pressure):
    - Raised JVP → Right heart failure, cardiac tamponade, SVC obstruction
    - Kussmaul's sign (JVP rises on inspiration) → Constrictive pericarditis

    Heart Sounds:
    - S1 (mitral/tricuspid closure), S2 (aortic/pulmonary closure)
    - Loud S1 → Mitral stenosis | Soft S1 → Mitral regurgitation
    - Fixed split S2 → ASD | Wide split S2 → RBBB, pulmonary stenosis
    - S3 gallop → Heart failure (pathological in adults >40)
    - S4 gallop → Reduced ventricular compliance (hypertension, MI)

    Murmurs:
    - Systolic ejection murmur, radiates to carotids → Aortic stenosis
    - Pansystolic murmur, apex to axilla → Mitral regurgitation
    - Mid-diastolic murmur at apex → Mitral stenosis (opening snap)
    - Early diastolic murmur, left sternal edge → Aortic regurgitation

    RESPIRATORY EXAMINATION:
    Trachea: Deviated AWAY from large effusion/tension pneumothorax
              Deviated TOWARD collapse/fibrosis

    Percussion:
    - Dull → Consolidation, effusion, collapse
    - Hyper-resonant → Pneumothorax, emphysema, large bulla

    Auscultation:
    - Bronchial breathing → Consolidation
    - Reduced air entry → Pleural effusion, pneumothorax, collapse
    - Wheeze → Asthma, COPD, bronchospasm
    - Crackles (fine) → Pulmonary fibrosis, early pulmonary edema
    - Crackles (coarse) → LRTI, bronchiectasis, pulmonary edema
    - Pleural rub → Pleuritis, PE

    ABDOMINAL EXAMINATION:
    Tenderness patterns:
    - RUQ → Liver, gallbladder (cholecystitis)
    - LUQ → Spleen, stomach
    - RLQ → Appendicitis (McBurney's point), ovarian cyst
    - LLQ → Diverticulitis, ovarian cyst
    - Epigastric → Gastritis, peptic ulcer, pancreatitis, MI (referred)
    - Periumbilical (early appendicitis → migrates to RLQ)
    - Generalized → Peritonitis, bowel obstruction

    Murphy's sign: RUQ pain worse on inspiration → Acute cholecystitis
    Rovsing's sign: Pressure on LLQ causes RLQ pain → Appendicitis
    Shifting dullness + fluid thrill → Ascites
    Rebound tenderness, guarding, rigidity → Peritonitis

    NEUROLOGICAL EXAMINATION:
    Power (MRC Scale): 0=No movement, 1=Flicker, 2=Movement with gravity eliminated,
    3=Movement against gravity, 4=Movement against resistance (reduced), 5=Normal

    Reflexes: 0=Absent, 1=Reduced, 2=Normal, 3=Brisk, 4=Clonus
    UMN signs: Spasticity, hyperreflexia, upgoing plantars (Babinski), clonus, weakness
    LMN signs: Flaccidity, hyporeflexia, fasciculations, muscle wasting, weakness

    Cranial Nerves:
    CN II: Visual acuity, visual fields, fundoscopy
    CN III: Ptosis, dilated pupil, eye deviated "down and out" → CN III palsy
    CN VII: Facial nerve — forehead spared in UMN lesion (stroke), forehead affected in LMN (Bell's palsy)
    CN XII: Tongue deviates TOWARD side of lesion in LMN palsy

    Cerebellar signs (DANISH):
    Dysdiadochokinesia, Ataxia (gait), Nystagmus, Intention tremor, Slurred speech (dysarthria), Hypotonia
    """,
]