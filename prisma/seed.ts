import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";
import { generateActionPlan } from "../src/lib/actions/generate-action-plan";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.complianceDocument.deleteMany();
  await prisma.actionItem.deleteMany();
  await prisma.actionTemplate.deleteMany();
  await prisma.complianceStatus.deleteMany();
  await prisma.dashboardData.deleteMany();
  await prisma.organizationRegulation.deleteMany();
  await prisma.organizationDomain.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.requirementCategory.deleteMany();
  await prisma.regulation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // === ORGANIZATIONS ===
  const arnhem = await prisma.organization.create({
    data: {
      name: "Gemeente Arnhem",
      slug: "gemeente-arnhem",
      sector: "GEMEENTE",
      employeeCount: 3200,
      primaryColor: "#1F4E79",
      complianceCenterEnabled: true,
    },
  });

  const wageningen = await prisma.organization.create({
    data: {
      name: "Gemeente Wageningen",
      slug: "gemeente-wageningen",
      sector: "GEMEENTE",
      employeeCount: 850,
      primaryColor: "#2E75B6",
    },
  });

  const bedrijf = await prisma.organization.create({
    data: {
      name: "Voorbeeld Bedrijf B.V.",
      slug: "voorbeeld-bedrijf",
      sector: "FINANCIEEL",
      employeeCount: 15000,
      primaryColor: "#0D9488",
      complianceCenterEnabled: true,
    },
  });

  // === ORGANIZATION DOMAINS (for SSO matching) ===
  await prisma.organizationDomain.createMany({
    data: [
      { organizationId: arnhem.id, domain: "arnhem.nl" },
      { organizationId: wageningen.id, domain: "wageningen.nl" },
      { organizationId: bedrijf.id, domain: "voorbeeldbedrijf.nl" },
    ],
  });

  // === USERS ===
  const hashedAdmin = await bcryptjs.hash("admin123", 10);
  const hashedDemo = await bcryptjs.hash("demo123", 10);

  await prisma.user.create({
    data: { email: "admin@revact.ai", password: hashedAdmin, name: "RevAct Admin", role: "ADMIN" },
  });

  const lisa = await prisma.user.create({
    data: { email: "hr@arnhem.nl", password: hashedDemo, name: "Lisa van der Berg", role: "CLIENT_ADMIN", organizationId: arnhem.id },
  });

  const jan = await prisma.user.create({
    data: { email: "j.devries@arnhem.nl", password: hashedDemo, name: "Jan de Vries", role: "CLIENT_USER", organizationId: arnhem.id },
  });

  await prisma.user.create({
    data: { email: "hr@wageningen.nl", password: hashedDemo, name: "HR Gemeente Wageningen", role: "CLIENT_USER", organizationId: wageningen.id },
  });

  await prisma.user.create({
    data: { email: "hr@voorbeeldbedrijf.nl", password: hashedDemo, name: "HR Voorbeeld Bedrijf", role: "CLIENT_ADMIN", organizationId: bedrijf.id },
  });

  // ============================================================
  // === REGULATION 1: Gender Equality Plan (Horizon Europe) ===
  // ============================================================
  const gep = await prisma.regulation.create({
    data: {
      name: "Gender Equality Plan (Horizon Europe)",
      slug: "gender-equality-plan",
      description: "Verplichting vanuit Horizon Europe voor organisaties die EU-financiering ontvangen. Een Gender Equality Plan (GEP) moet voldoen aan vier verplichte procesvereisten.",
      authority: "Europese Commissie",
      effectiveDate: new Date("2022-01-01"),
      officialReference: "Horizon Europe Regulation (EU) 2021/695",
      scope: "Universiteiten, onderzoeksinstellingen en publieke organisaties die Horizon Europe-subsidies aanvragen",
      applicableSectors: JSON.stringify(["GEMEENTE", "OVERHEID", "ONDERWIJS"]),
      sourceUrl: "https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en",
      penaltyInfo: "Geen GEP = niet in aanmerking voor Horizon Europe-subsidie",
      category: "GENDER",
      isActive: true,
    },
  });

  // GEP Categories & Requirements
  const gepCat1 = await prisma.requirementCategory.create({
    data: { regulationId: gep.id, name: "Openbaar Document", description: "Het GEP moet een formeel, openbaar document zijn dat ondertekend is door het management.", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: gepCat1.id, title: "Publicatie GEP op website", description: "Het Gender Equality Plan is openbaar gepubliceerd op de website van de organisatie.", guidance: "Plaats het GEP-document op een goed vindbare plek op de organisatiewebsite, bijvoorbeeld onder beleidsdocumenten of diversiteit & inclusie.", evidenceType: "DOCUMENT", priority: "HIGH", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: gepCat1.id, title: "Ondertekening door management", description: "Het document is formeel goedgekeurd en ondertekend door het hoogste management.", guidance: "Zorg voor een getekende versie door de directeur of het college van B&W.", evidenceType: "DOCUMENT", priority: "HIGH", sortOrder: 2 },
  });

  const gepCat2 = await prisma.requirementCategory.create({
    data: { regulationId: gep.id, name: "Toegewezen Middelen", description: "Er moeten dedicated middelen en expertise worden toegewezen voor de implementatie van het GEP.", sortOrder: 2 },
  });
  await prisma.requirement.create({
    data: { categoryId: gepCat2.id, title: "Budget voor genderbeleid", description: "Er is een specifiek budget gereserveerd voor gendergelijkheidinitiatieven.", guidance: "Documenteer het toegewezen budget in de begroting.", evidenceType: "POLICY", priority: "HIGH", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: gepCat2.id, title: "Aangewezen GEP-coördinator", description: "Er is een persoon of team aangewezen die verantwoordelijk is voor de uitvoering van het GEP.", guidance: "Wijs een GEP-coördinator aan met duidelijke taken en bevoegdheden.", evidenceType: "POLICY", priority: "MEDIUM", sortOrder: 2 },
  });

  const gepCat3 = await prisma.requirementCategory.create({
    data: { regulationId: gep.id, name: "Data & Monitoring", description: "Dataverzameling en monitoring over genderverdeling in de organisatie.", sortOrder: 3 },
  });
  await prisma.requirement.create({
    data: { categoryId: gepCat3.id, title: "Genderdata per functieniveau", description: "Jaarlijks overzicht van de man/vrouw-verdeling per functieniveau.", guidance: "Verzamel data over genderverdeling op directie-, management-, senior-, medior- en juniorniveau.", evidenceType: "DATA_ANALYSIS", priority: "HIGH", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: gepCat3.id, title: "Genderdata per afdeling", description: "Overzicht van genderverdeling per afdeling of organisatie-eenheid.", guidance: "Breng per afdeling de man/vrouw-verdeling in kaart.", evidenceType: "DATA_ANALYSIS", priority: "MEDIUM", sortOrder: 2 },
  });
  await prisma.requirement.create({
    data: { categoryId: gepCat3.id, title: "Monitoring & rapportage", description: "Jaarlijkse monitoring en rapportage van voortgang op GEP-doelstellingen.", guidance: "Stel een jaarlijks voortgangsrapport op met meetbare indicatoren.", evidenceType: "REPORT", priority: "MEDIUM", sortOrder: 3 },
  });

  const gepCat4 = await prisma.requirementCategory.create({
    data: { regulationId: gep.id, name: "Training & Bewustwording", description: "Training en bewustwordingsactiviteiten rond gendergelijkheid.", sortOrder: 4 },
  });
  await prisma.requirement.create({
    data: { categoryId: gepCat4.id, title: "Trainingen genderbewustzijn", description: "Er worden trainingen aangeboden over onbewuste vooroordelen en genderbewustzijn.", guidance: "Organiseer minimaal jaarlijks een training voor medewerkers en management.", evidenceType: "TRAINING", priority: "MEDIUM", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: gepCat4.id, title: "Communicatiecampagne", description: "Interne communicatie over het belang van gendergelijkheid en het GEP.", guidance: "Voer minstens twee keer per jaar een interne communicatieactie uit.", evidenceType: "TRAINING", priority: "LOW", sortOrder: 2 },
  });

  // GEP Action Templates
  const gepT1 = await prisma.actionTemplate.create({
    data: { regulationId: gep.id, title: "Projectorganisatie opzetten", description: "Richt de projectorganisatie in met een team, rollen en een duidelijke planning.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 14 },
  });
  for (const sub of [
    { title: "Projectleider aanwijzen", description: "Wijs een projectleider aan die verantwoordelijk is voor het volledige GEP-traject.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 3 },
    { title: "Projectteam samenstellen", description: "Stel een projectteam samen met vertegenwoordigers van: HR, management/MT, OR/medezeggenschap.", priority: "HIGH", sortOrder: 2, relativeDeadlineDays: 7 },
    { title: "Kickoff meeting organiseren", description: "Plan een kickoff meeting met alle teamleden en stakeholders.", priority: "HIGH", sortOrder: 3, relativeDeadlineDays: 10 },
    { title: "Projectplanning vaststellen", description: "Maak een gedetailleerde projectplanning met milestones, deadlines en verantwoordelijken.", priority: "MEDIUM", sortOrder: 4, relativeDeadlineDays: 14 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: gep.id, parentId: gepT1.id } });
  }

  const gepT2 = await prisma.actionTemplate.create({
    data: { regulationId: gep.id, title: "Data verzamelen en inventariseren", description: "Breng alle benodigde geslacht-uitgesplitste HR-data in kaart.", priority: "HIGH", sortOrder: 2, relativeDeadlineDays: 30 },
  });
  for (const sub of [
    { title: "Databehoeften in kaart brengen", description: "Stel een lijst op van alle benodigde data: personeelsaantallen per gender, functieniveau, afdeling, contractvorm.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 16 },
    { title: "Databronnen identificeren", description: "Inventariseer welke systemen de data bevatten en wie de data-eigenaren zijn.", priority: "HIGH", sortOrder: 2, relativeDeadlineDays: 18 },
    { title: "Data-gaps identificeren", description: "Bepaal welke data ontbreekt of onvolledig is.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 21 },
    { title: "Data aanleveren in afgesproken format", description: "Exporteer de geanonimiseerde data in het afgesproken format.", priority: "HIGH", sortOrder: 4, relativeDeadlineDays: 28 },
    { title: "Data valideren met HR", description: "Loop de aangeleverde dataset door met HR om te controleren of de cijfers kloppen.", priority: "MEDIUM", sortOrder: 5, relativeDeadlineDays: 30 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: gep.id, parentId: gepT2.id } });
  }

  const gepT3 = await prisma.actionTemplate.create({
    data: { regulationId: gep.id, title: "Nulmeting en analyse uitvoeren", description: "Voer de kwantitatieve genderanalyse uit die de baseline vormt voor het GEP.", priority: "HIGH", sortOrder: 3, relativeDeadlineDays: 50 },
  });
  for (const sub of [
    { title: "Kwantitatieve genderanalyse uitvoeren", description: "Analyseer de m/v-verdeling per functieniveau, afdeling, contractvorm en loonschaal.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 38 },
    { title: "Trends over tijd analyseren", description: "Vergelijk de data over meerdere jaren om trends te identificeren.", priority: "MEDIUM", sortOrder: 2, relativeDeadlineDays: 42 },
    { title: "Benchmarking uitvoeren", description: "Vergelijk de uitkomsten met sectorgemiddelden.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 45 },
    { title: "Nulmeting-rapport opstellen", description: "Bundel alle analyseresultaten in een helder nulmeting-rapport.", priority: "HIGH", sortOrder: 4, relativeDeadlineDays: 50 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: gep.id, parentId: gepT3.id } });
  }

  const gepT4 = await prisma.actionTemplate.create({
    data: { regulationId: gep.id, title: "GEP-document opstellen en publiceren", description: "Schrijf het Gender Equality Plan, laat het goedkeuren door het bestuur en publiceer het.", priority: "HIGH", sortOrder: 4, relativeDeadlineDays: 90 },
  });
  for (const sub of [
    { title: "Concept GEP schrijven", description: "Schrijf het concept GEP met inleiding, nulmeting-resultaten, doelstellingen, maatregelen en tijdlijn.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 60 },
    { title: "Feedback verzamelen bij stakeholders", description: "Deel het concept met het projectteam, OR en relevante afdelingshoofden.", priority: "MEDIUM", sortOrder: 2, relativeDeadlineDays: 70 },
    { title: "GEP presenteren aan MT/bestuur", description: "Presenteer het definitieve concept aan het MT of bestuur.", priority: "HIGH", sortOrder: 3, relativeDeadlineDays: 80 },
    { title: "GEP publiceren op website", description: "Publiceer het ondertekende GEP op de organisatie-website.", priority: "HIGH", sortOrder: 4, relativeDeadlineDays: 85 },
    { title: "Interne communicatie over GEP", description: "Informeer alle medewerkers over het GEP.", priority: "MEDIUM", sortOrder: 5, relativeDeadlineDays: 90 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: gep.id, parentId: gepT4.id } });
  }

  const gepT5 = await prisma.actionTemplate.create({
    data: { regulationId: gep.id, title: "Training & bewustwording organiseren", description: "Organiseer trainingen over unconscious bias en genderbewustzijn.", priority: "MEDIUM", sortOrder: 5, relativeDeadlineDays: 120 },
  });
  for (const sub of [
    { title: "Trainingsbehoeften inventariseren", description: "Bepaal welke doelgroepen training nodig hebben.", priority: "MEDIUM", sortOrder: 1, relativeDeadlineDays: 55 },
    { title: "Trainingsaanbieder selecteren", description: "Vraag offertes aan bij minimaal 2 trainingsaanbieders.", priority: "MEDIUM", sortOrder: 2, relativeDeadlineDays: 65 },
    { title: "Trainingsplanning opstellen", description: "Plan de eerste trainingsronde in.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 75 },
    { title: "Eerste trainingsronde uitvoeren", description: "Voer de unconscious bias training uit voor alle leidinggevenden.", priority: "MEDIUM", sortOrder: 4, relativeDeadlineDays: 100 },
    { title: "Training evalueren en vervolgplan maken", description: "Evalueer de training en stel een plan op voor vervolgsessies.", priority: "LOW", sortOrder: 5, relativeDeadlineDays: 120 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: gep.id, parentId: gepT5.id } });
  }

  const gepT6 = await prisma.actionTemplate.create({
    data: { regulationId: gep.id, title: "Monitoring en rapportage inrichten", description: "Richt een structurele monitoringcyclus in.", priority: "MEDIUM", sortOrder: 6, relativeDeadlineDays: 365 },
  });
  for (const sub of [
    { title: "KPI's en indicatoren vaststellen", description: "Definieer meetbare KPI's per GEP-doelstelling.", priority: "MEDIUM", sortOrder: 1, relativeDeadlineDays: 95 },
    { title: "Monitoringproces inrichten", description: "Bepaal wie de data verzamelt, wanneer en in welk format.", priority: "MEDIUM", sortOrder: 2, relativeDeadlineDays: 100 },
    { title: "Dashboard/rapportage-tooling inrichten", description: "Zorg dat de data in het RevAct Comply platform terechtkomt.", priority: "LOW", sortOrder: 3, relativeDeadlineDays: 120 },
    { title: "Eerste jaarlijkse voortgangsrapportage", description: "Stel na 1 jaar de eerste voortgangsrapportage op.", priority: "LOW", sortOrder: 4, relativeDeadlineDays: 365 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: gep.id, parentId: gepT6.id } });
  }

  // ============================================================
  // === REGULATION 2: EU Pay Transparency Directive ===
  // ============================================================
  const payDir = await prisma.regulation.create({
    data: {
      name: "Beloningsstructuur Richtlijn (EU Pay Transparency)",
      slug: "eu-pay-transparency",
      description: "EU-richtlijn voor loontransparantie die organisaties verplicht tot openheid over beloningsverschillen tussen mannen en vrouwen.",
      authority: "Europese Commissie",
      effectiveDate: new Date("2026-06-07"),
      officialReference: "Richtlijn (EU) 2023/970",
      transpositionDate: new Date("2026-06-07"),
      scope: "Alle werkgevers. Rapportageplicht voor 100+ medewerkers. Uitgebreide rapportage voor 250+",
      applicableSectors: JSON.stringify(["GEMEENTE", "OVERHEID", "FINANCIEEL", "ONDERWIJS", "ZORG", "OVERIG"]),
      sourceUrl: "https://eur-lex.europa.eu/eli/dir/2023/970/oj/eng",
      penaltyInfo: "Administratieve boetes, bewijslast verschuift naar werkgever bij loonverschillen >5%",
      category: "BELONING",
      isActive: true,
    },
  });

  const payCat1 = await prisma.requirementCategory.create({
    data: { regulationId: payDir.id, name: "Loontransparantie", description: "Transparantie over beloningsniveaus en -criteria.", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: payCat1.id, title: "Salarisschalen publiceren", description: "Salarisschalen of bandbreedtes zijn beschikbaar voor medewerkers.", guidance: "Maak salarisschalen per functiegroep inzichtelijk.", evidenceType: "POLICY", priority: "HIGH", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: payCat1.id, title: "Beloningscriteria vastgelegd", description: "De criteria voor salariëring, promotie en bonussen zijn vastgelegd en objectief.", guidance: "Documenteer de beloningscriteria en zorg dat ze genderneutraal zijn.", evidenceType: "POLICY", priority: "HIGH", sortOrder: 2 },
  });

  const payCat2 = await prisma.requirementCategory.create({
    data: { regulationId: payDir.id, name: "Rapportageverplichting", description: "Verplichte rapportage over beloningsverschillen.", sortOrder: 2 },
  });
  await prisma.requirement.create({
    data: { categoryId: payCat2.id, title: "Gender pay gap rapport", description: "Jaarlijks rapport over de loonkloof tussen mannen en vrouwen.", guidance: "Bereken en publiceer het verschil in gemiddeld en mediaan salaris per geslacht.", evidenceType: "REPORT", priority: "HIGH", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: payCat2.id, title: "Actieplan bij >5% verschil", description: "Bij een loonverschil van meer dan 5% is een actieplan verplicht.", guidance: "Als het ongecorrigeerde loonverschil meer dan 5% bedraagt, stel dan een actieplan op.", evidenceType: "POLICY", priority: "MEDIUM", sortOrder: 2 },
  });

  const payCat3 = await prisma.requirementCategory.create({
    data: { regulationId: payDir.id, name: "Gelijke Beloning", description: "Waarborging van gelijke beloning voor gelijk werk.", sortOrder: 3 },
  });
  await prisma.requirement.create({
    data: { categoryId: payCat3.id, title: "Functiewaarderingssysteem", description: "Een genderneutraal functiewaarderingssysteem is geïmplementeerd.", guidance: "Gebruik een objectief en wetenschappelijk onderbouwd functiewaarderingssysteem.", evidenceType: "POLICY", priority: "HIGH", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: payCat3.id, title: "Beloningsaudit", description: "Periodieke audit van beloningspraktijken op genderverschillen.", guidance: "Voer minimaal tweejaarlijks een beloningsaudit uit.", evidenceType: "DATA_ANALYSIS", priority: "MEDIUM", sortOrder: 2 },
  });

  // Pay Transparency Action Templates
  const payT1 = await prisma.actionTemplate.create({
    data: { regulationId: payDir.id, title: "Beloningsdata in kaart brengen", description: "Inventariseer alle beloningscomponenten en maak de data klaar voor analyse.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 30 },
  });
  for (const sub of [
    { title: "Beloningscomponenten inventariseren", description: "Maak een compleet overzicht van alle beloningscomponenten.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 10 },
    { title: "Data per gender uitsplitsen", description: "Koppel beloningsdata aan geslacht per functiegroep, schaal en afdeling.", priority: "HIGH", sortOrder: 2, relativeDeadlineDays: 18 },
    { title: "Datakwaliteit controleren", description: "Controleer de data op ontbrekende waarden en inconsistenties.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 25 },
    { title: "Dataset klaarzetten voor analyse", description: "Lever de gevalideerde dataset aan in het afgesproken format.", priority: "HIGH", sortOrder: 4, relativeDeadlineDays: 30 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: payDir.id, parentId: payT1.id } });
  }

  const payT2 = await prisma.actionTemplate.create({
    data: { regulationId: payDir.id, title: "Gender pay gap analyse", description: "Bereken en analyseer de loonkloof.", priority: "HIGH", sortOrder: 2, relativeDeadlineDays: 50 },
  });
  for (const sub of [
    { title: "Ongecorrigeerde loonkloof berekenen", description: "Bereken de ruwe loonkloof: verschil in gemiddeld bruto uurloon.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 35 },
    { title: "Gecorrigeerde loonkloof berekenen", description: "Bereken de gecorrigeerde loonkloof door te corrigeren voor functieniveau, ervaring, opleiding.", priority: "HIGH", sortOrder: 2, relativeDeadlineDays: 40 },
    { title: "Risicogroepen identificeren", description: "Identificeer functiegroepen waar de loonkloof groter is dan 5%.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 45 },
    { title: "Analyse-rapport opstellen", description: "Bundel de resultaten in een duidelijk rapport.", priority: "HIGH", sortOrder: 4, relativeDeadlineDays: 50 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: payDir.id, parentId: payT2.id } });
  }

  const payT3 = await prisma.actionTemplate.create({
    data: { regulationId: payDir.id, title: "Beleid toetsen en aanpassen", description: "Toets het huidige beloningsbeleid aan de EU-richtlijn.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 70 },
  });
  for (const sub of [
    { title: "Beloningsbeleid toetsen aan richtlijn", description: "Beoordeel of het huidige beloningsbeleid objectieve, genderneutrale criteria hanteert.", priority: "MEDIUM", sortOrder: 1, relativeDeadlineDays: 40 },
    { title: "Functiewaardering controleren", description: "Controleer of de functiewaarderingssystematiek genderneutraal is.", priority: "MEDIUM", sortOrder: 2, relativeDeadlineDays: 50 },
    { title: "Verbeterpunten formuleren", description: "Stel een lijst op van concrete verbeterpunten.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 60 },
    { title: "Actieplan ongelijke beloning", description: "Stel een actieplan op voor het dichten van onverklaarde loonverschillen.", priority: "MEDIUM", sortOrder: 4, relativeDeadlineDays: 70 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: payDir.id, parentId: payT3.id } });
  }

  const payT4 = await prisma.actionTemplate.create({
    data: { regulationId: payDir.id, title: "Rapportage opstellen en publiceren", description: "Stel de verplichte beloningsrapportage op.", priority: "HIGH", sortOrder: 4, relativeDeadlineDays: 100 },
  });
  for (const sub of [
    { title: "Rapportageformat opstellen", description: "Ontwikkel een rapportagetemplate conform de EU Pay Transparency Directive.", priority: "MEDIUM", sortOrder: 1, relativeDeadlineDays: 55 },
    { title: "Beloningsrapportage schrijven", description: "Stel de eerste officiële beloningsrapportage op.", priority: "HIGH", sortOrder: 2, relativeDeadlineDays: 80 },
    { title: "Rapportage laten reviewen", description: "Laat de rapportage reviewen door juridische zaken.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 90 },
    { title: "Rapportage publiceren", description: "Publiceer de beloningsrapportage.", priority: "HIGH", sortOrder: 4, relativeDeadlineDays: 95 },
    { title: "Communicatie naar medewerkers", description: "Informeer alle medewerkers over de resultaten.", priority: "LOW", sortOrder: 5, relativeDeadlineDays: 100 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: payDir.id, parentId: payT4.id } });
  }

  // ============================================================
  // === REGULATION 3: Women on Boards Directive ===
  // ============================================================
  const wob = await prisma.regulation.create({
    data: {
      name: "Women on Boards Directive",
      slug: "women-on-boards",
      description: "EU-richtlijn die beursgenoteerde bedrijven verplicht om een evenwichtige gendervertegenwoordiging in hun bestuur te realiseren. Het doel is minimaal 40% van het ondervertegenwoordigde geslacht onder niet-uitvoerende bestuurders, of 33% van alle bestuurszetels.",
      officialReference: "Richtlijn (EU) 2022/2381",
      authority: "Europese Commissie",
      effectiveDate: new Date("2026-06-30"),
      transpositionDate: new Date("2024-12-28"),
      category: "GENDER",
      scope: "Beursgenoteerde bedrijven met 250+ medewerkers. Niet van toepassing op MKB/KMO's.",
      applicableSectors: JSON.stringify(["FINANCIEEL", "OVERIG"]),
      sourceUrl: "https://eur-lex.europa.eu/eli/dir/2022/2381/oj",
      penaltyInfo: "Lidstaten stellen sancties vast: waarschuwingen, boetes, nietigverklaring van bestuursbenoemingen",
      isActive: true,
    },
  });

  // WoB Categories & Requirements
  const wobCat1 = await prisma.requirementCategory.create({
    data: { regulationId: wob.id, name: "Kwantitatieve Doelstellingen", description: "Doelstellingen voor genderbalans in het bestuur.", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: wobCat1.id, title: "Genderbalans niet-uitvoerend bestuur", description: "Minimaal 40% van de niet-uitvoerende bestuurszetels moet bezet worden door het ondervertegenwoordigde geslacht.", guidance: "Tel alle niet-uitvoerende bestuurders. Bereken het percentage vrouwen. Als dit onder 40% ligt, is actie vereist.", evidenceType: "DATA_ANALYSIS", priority: "HIGH", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: wobCat1.id, title: "Alternatieve doelstelling: 33% alle bestuurders", description: "Indien de 40%-doelstelling niet wordt nagestreefd: minimaal 33% van alle bestuurszetels moet bezet worden door het ondervertegenwoordigde geslacht.", guidance: "Dit is het alternatief voor de 40%-norm. Kies één van beide doelstellingen.", evidenceType: "DATA_ANALYSIS", priority: "HIGH", sortOrder: 2 },
  });

  const wobCat2 = await prisma.requirementCategory.create({
    data: { regulationId: wob.id, name: "Selectieprocedure", description: "Transparante en genderneutrale selectieprocedure voor bestuursbenoemingen.", sortOrder: 2 },
  });
  await prisma.requirement.create({
    data: { categoryId: wobCat2.id, title: "Transparante selectiecriteria", description: "Bestuursbenoemingen moeten gebaseerd zijn op objectieve, duidelijk geformuleerde en genderneutrale criteria.", guidance: "Documenteer het selectieproces, de gebruikte criteria, en hoe genderneutraliteit is gewaarborgd.", evidenceType: "POLICY", priority: "MEDIUM", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: wobCat2.id, title: "Voorrangsregel bij gelijke geschiktheid", description: "Bij gelijke kwalificatie krijgt een kandidaat van het ondervertegenwoordigde geslacht voorrang.", guidance: "Leg vast hoe de voorrangsregel wordt toegepast en documenteer beslissingen.", evidenceType: "POLICY", priority: "MEDIUM", sortOrder: 2 },
  });

  const wobCat3 = await prisma.requirementCategory.create({
    data: { regulationId: wob.id, name: "Rapportage en Transparantie", description: "Jaarlijkse rapportage over genderbalans in het bestuur.", sortOrder: 3 },
  });
  await prisma.requirement.create({
    data: { categoryId: wobCat3.id, title: "Jaarlijkse rapportage genderbalans bestuur", description: "Publiceer jaarlijks de genderverdeling in het bestuur en de genomen maatregelen.", guidance: "Neem op: huidige samenstelling, vergelijking met vorig jaar, genomen maatregelen.", evidenceType: "REPORT", priority: "HIGH", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: wobCat3.id, title: "Uitleg bij niet-behalen doelstelling", description: "Indien de doelstelling niet is behaald: geef een verklaring en beschrijf de geplande maatregelen met tijdlijn.", guidance: "Comply-or-explain principe.", evidenceType: "REPORT", priority: "HIGH", sortOrder: 2 },
  });

  // WoB Action Templates
  const wobT1 = await prisma.actionTemplate.create({
    data: { regulationId: wob.id, title: "Nulmeting bestuurssamenstelling", description: "Breng de huidige genderverdeling in het bestuur in kaart.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 21 },
  });
  for (const sub of [
    { title: "Huidige bestuurssamenstelling inventariseren", description: "Breng de huidige genderverdeling in het bestuur in kaart: uitvoerend en niet-uitvoerend.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 7 },
    { title: "Gap-analyse uitvoeren", description: "Bereken het verschil met de 40%/33% doelstelling.", priority: "HIGH", sortOrder: 2, relativeDeadlineDays: 14 },
    { title: "Benchmark met sector", description: "Vergelijk de eigen bestuurssamenstelling met sectorgemiddelden.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 21 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: wob.id, parentId: wobT1.id } });
  }

  const wobT2 = await prisma.actionTemplate.create({
    data: { regulationId: wob.id, title: "Selectieprocedure aanpassen", description: "Pas de selectieprocedure aan voor genderneutrale bestuursbenoemingen.", priority: "MEDIUM", sortOrder: 2, relativeDeadlineDays: 60 },
  });
  for (const sub of [
    { title: "Selectiecriteria herzien", description: "Toets de huidige selectiecriteria op genderneutraliteit.", priority: "MEDIUM", sortOrder: 1, relativeDeadlineDays: 30 },
    { title: "Voorrangsregel implementeren", description: "Stel een procedure op voor de voorrangsregel bij gelijke geschiktheid.", priority: "MEDIUM", sortOrder: 2, relativeDeadlineDays: 45 },
    { title: "Longlist-procedure diversifiëren", description: "Zorg dat longlistprocedures een diverse kandidatenpool opleveren.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 60 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: wob.id, parentId: wobT2.id } });
  }

  const wobT3 = await prisma.actionTemplate.create({
    data: { regulationId: wob.id, title: "Rapportage opzetten", description: "Richt de jaarlijkse rapportage in.", priority: "HIGH", sortOrder: 3, relativeDeadlineDays: 90 },
  });
  for (const sub of [
    { title: "Rapportagetemplate opstellen", description: "Maak een template voor de jaarlijkse rapportage over genderbalans.", priority: "MEDIUM", sortOrder: 1, relativeDeadlineDays: 45 },
    { title: "Eerste rapportage opstellen", description: "Stel de eerste rapportage op met huidige cijfers en maatregelen.", priority: "HIGH", sortOrder: 2, relativeDeadlineDays: 75 },
    { title: "Rapportage publiceren", description: "Publiceer de rapportage op de bedrijfswebsite en in het jaarverslag.", priority: "HIGH", sortOrder: 3, relativeDeadlineDays: 90 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: wob.id, parentId: wobT3.id } });
  }

  // ============================================================
  // === REGULATION 4: CSRD Sociale Rapportage (ESG) ===
  // ============================================================
  const csrd = await prisma.regulation.create({
    data: {
      name: "CSRD Sociale Rapportage (ESG)",
      slug: "csrd-sociale-rapportage",
      description: "De Corporate Sustainability Reporting Directive verplicht grote bedrijven om te rapporteren over duurzaamheid, waaronder de sociale pijler: diversiteit, gelijke behandeling, arbeidsomstandigheden, en mensenrechten.",
      officialReference: "Richtlijn (EU) 2022/2464 + ESRS S1",
      authority: "Europese Commissie",
      effectiveDate: new Date("2024-01-01"),
      transpositionDate: new Date("2024-07-06"),
      category: "ESG",
      scope: "Grote ondernemingen (250+ medewerkers, €50M+ omzet of €25M+ balanstotaal). Beursgenoteerd: boekjaar 2024. Overige groot: boekjaar 2025.",
      applicableSectors: JSON.stringify(["FINANCIEEL", "OVERIG"]),
      sourceUrl: "https://eur-lex.europa.eu/eli/dir/2022/2464/oj",
      penaltyInfo: "Sancties vastgesteld door lidstaten: boetes, publieke reprimande, bevel tot naleving",
      isActive: true,
    },
  });

  // CSRD Categories & Requirements
  const csrdCat1 = await prisma.requirementCategory.create({
    data: { regulationId: csrd.id, name: "Eigen Personeel — Gelijke Behandeling (ESRS S1)", description: "Rapportage over diversiteit, gelijke behandeling en beloning van eigen personeel.", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: csrdCat1.id, title: "Diversiteitsbeleid en doelstellingen", description: "Beschrijf het beleid inzake diversiteit en inclusie, de doelstellingen, en de voortgang.", guidance: "ESRS S1-6: rapporteer kenmerken van werknemers inclusief genderverdeling op alle niveaus.", evidenceType: "POLICY", priority: "HIGH", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: csrdCat1.id, title: "Gender pay gap rapportage", description: "Rapporteer de ongecorrigeerde loonkloof tussen mannen en vrouwen.", guidance: "ESRS S1-16: verplicht voor CSRD-rapportage.", evidenceType: "DATA_ANALYSIS", priority: "HIGH", sortOrder: 2 },
  });
  await prisma.requirement.create({
    data: { categoryId: csrdCat1.id, title: "Adequate beloning", description: "Rapporteer of werknemers een adequaat loon ontvangen.", guidance: "ESRS S1-10: vergelijk laagste loonschalen met applicable benchmarks.", evidenceType: "DATA_ANALYSIS", priority: "MEDIUM", sortOrder: 3 },
  });

  const csrdCat2 = await prisma.requirementCategory.create({
    data: { regulationId: csrd.id, name: "Arbeidsomstandigheden", description: "Rapportage over werktijden, verlof, flexibel werken en gezondheid.", sortOrder: 2 },
  });
  await prisma.requirement.create({
    data: { categoryId: csrdCat2.id, title: "Arbeidsvoorwaarden en work-life balance", description: "Rapporteer over werktijden, verlofbeleid, flexibel werken, en contractvormen uitgesplitst naar gender.", guidance: "ESRS S1-8: rapporteer contractvormen, werktijden en verlofopname per gender.", evidenceType: "DATA_ANALYSIS", priority: "MEDIUM", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: csrdCat2.id, title: "Gezondheid en veiligheid", description: "Rapporteer over arbeidsongevallen, beroepsziekten en ziekteverzuimpercentage.", guidance: "ESRS S1-14: kwantitatieve metrics over gezondheid en veiligheid.", evidenceType: "DATA_ANALYSIS", priority: "MEDIUM", sortOrder: 2 },
  });

  const csrdCat3 = await prisma.requirementCategory.create({
    data: { regulationId: csrd.id, name: "Opleiding en Ontwikkeling", description: "Rapportage over training, ontwikkeling en medezeggenschap.", sortOrder: 3 },
  });
  await prisma.requirement.create({
    data: { categoryId: csrdCat3.id, title: "Trainingsuren en ontwikkelingsinvesteringen", description: "Rapporteer het gemiddeld aantal trainingsuren per medewerker, uitgesplitst naar gender.", guidance: "ESRS S1-13: kwantitatieve data over training en ontwikkeling.", evidenceType: "DATA_ANALYSIS", priority: "LOW", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: csrdCat3.id, title: "Medezeggenschap en sociaal overleg", description: "Beschrijf hoe medewerkers worden betrokken bij besluitvorming en het bereik van CAO's.", guidance: "ESRS S1-8: rapporteer % medewerkers gedekt door CAO.", evidenceType: "POLICY", priority: "LOW", sortOrder: 2 },
  });

  // CSRD Action Templates
  const csrdT1 = await prisma.actionTemplate.create({
    data: { regulationId: csrd.id, title: "Materialiteitsanalyse sociale thema's", description: "Bepaal welke sociale thema's materieel zijn voor uw organisatie.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 45 },
  });
  for (const sub of [
    { title: "Dubbele materialiteitsanalyse uitvoeren", description: "Bepaal welke sociale thema's (ESRS S1-S4) materieel zijn.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 21 },
    { title: "Stakeholders consulteren", description: "Betrek werknemers, OR, vakbonden bij de materialiteitsanalyse.", priority: "MEDIUM", sortOrder: 2, relativeDeadlineDays: 30 },
    { title: "Scope en grenzen bepalen", description: "Bepaal welke onderdelen binnen scope vallen voor de sociale rapportage.", priority: "HIGH", sortOrder: 3, relativeDeadlineDays: 45 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: csrd.id, parentId: csrdT1.id } });
  }

  const csrdT2 = await prisma.actionTemplate.create({
    data: { regulationId: csrd.id, title: "Data verzamelen (ESRS S1)", description: "Verzamel alle benodigde sociale data.", priority: "HIGH", sortOrder: 2, relativeDeadlineDays: 90 },
  });
  for (const sub of [
    { title: "Personeelsdata uitsplitsen naar gender", description: "Verzamel genderverdeling per functieniveau, afdeling, contracttype.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 50 },
    { title: "Loonkloof berekenen", description: "Bereken de ongecorrigeerde gender pay gap (ESRS S1-16).", priority: "HIGH", sortOrder: 2, relativeDeadlineDays: 60 },
    { title: "Verlof- en werktijddata verzamelen", description: "Verzamel data over verlofopname, werktijden, flexibel werken per gender.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 70 },
    { title: "Training en ontwikkeling data", description: "Verzamel gemiddeld trainingsuren per medewerker per gender.", priority: "MEDIUM", sortOrder: 4, relativeDeadlineDays: 75 },
    { title: "Gezondheid en veiligheid metrics", description: "Verzamel data over arbeidsongevallen en ziekteverzuim.", priority: "MEDIUM", sortOrder: 5, relativeDeadlineDays: 90 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: csrd.id, parentId: csrdT2.id } });
  }

  const csrdT3 = await prisma.actionTemplate.create({
    data: { regulationId: csrd.id, title: "Beleid documenteren", description: "Documenteer het D&I-beleid en medezeggenschapsstructuur.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 60 },
  });
  for (const sub of [
    { title: "Diversiteits- en inclusiebeleid beschrijven", description: "Documenteer het beleid, doelstellingen en governance-structuur voor D&I.", priority: "MEDIUM", sortOrder: 1, relativeDeadlineDays: 30 },
    { title: "Medezeggenschapsstructuur beschrijven", description: "Documenteer hoe werknemers worden betrokken bij besluitvorming.", priority: "MEDIUM", sortOrder: 2, relativeDeadlineDays: 45 },
    { title: "Due diligence-proces documenteren", description: "Beschrijf hoe sociale risico's worden geïdentificeerd en beheerst.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 60 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: csrd.id, parentId: csrdT3.id } });
  }

  const csrdT4 = await prisma.actionTemplate.create({
    data: { regulationId: csrd.id, title: "Duurzaamheidsverslag opstellen", description: "Stel het sociale hoofdstuk van het duurzaamheidsverslag op.", priority: "HIGH", sortOrder: 4, relativeDeadlineDays: 150 },
  });
  for (const sub of [
    { title: "Concept sociale rapportage schrijven", description: "Schrijf het sociale hoofdstuk conform ESRS S1.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 110 },
    { title: "Interne review en validatie", description: "Laat reviewen door finance, HR en legal.", priority: "MEDIUM", sortOrder: 2, relativeDeadlineDays: 130 },
    { title: "Externe assurance voorbereiden", description: "Bereid data voor op externe assurance.", priority: "HIGH", sortOrder: 3, relativeDeadlineDays: 145 },
    { title: "Publicatie in jaarverslag", description: "Integreer de sociale rapportage in het jaarverslag.", priority: "HIGH", sortOrder: 4, relativeDeadlineDays: 150 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: csrd.id, parentId: csrdT4.id } });
  }

  // ============================================================
  // === REGULATION 5: CSDDD Due Diligence ===
  // ============================================================
  const csddd = await prisma.regulation.create({
    data: {
      name: "Corporate Sustainability Due Diligence (CSDDD)",
      slug: "csddd-due-diligence",
      description: "Verplicht grote bedrijven om mensenrechten- en milieu-due diligence uit te voeren in hun eigen operaties en waardeketen. Omvat ILO-kernverdragen: verbod op dwangarbeid, kinderarbeid, discriminatie.",
      officialReference: "Richtlijn (EU) 2024/1760",
      authority: "Europese Commissie",
      effectiveDate: new Date("2027-07-26"),
      transpositionDate: new Date("2027-07-26"),
      category: "ESG",
      scope: "Gefaseerd: 5000+ werknemers (2027), 3000+ (2028), 1000+ (2029). Netto-omzet >€450M-€1.5B afhankelijk van fase.",
      applicableSectors: JSON.stringify(["FINANCIEEL", "OVERIG"]),
      sourceUrl: "https://eur-lex.europa.eu/eli/dir/2024/1760/oj",
      penaltyInfo: "Substantiële boetes (proportioneel aan omzet), civiele aansprakelijkheid voor gedupeerden",
      isActive: true,
    },
  });

  // CSDDD Categories & Requirements
  const csdddCat1 = await prisma.requirementCategory.create({
    data: { regulationId: csddd.id, name: "Due Diligence Proces", description: "Het opzetten en onderhouden van een due diligence-proces.", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: csdddCat1.id, title: "Due diligence-beleid vaststellen", description: "Stel een due diligence-beleid op dat beschrijft hoe het bedrijf mensenrechten- en milieurisico's identificeert, voorkomt en verantwoording over aflegt.", guidance: "Het beleid moet goedgekeurd zijn door het bestuur en jaarlijks worden geactualiseerd.", evidenceType: "POLICY", priority: "HIGH", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: csdddCat1.id, title: "Risico-identificatie en prioritering", description: "Breng potentiële en feitelijke negatieve effecten in kaart in eigen operaties en waardeketen. Prioriteer op ernst en waarschijnlijkheid.", guidance: "Gebruik een risicoanalyse-framework. Betrek stakeholders bij de identificatie.", evidenceType: "DATA_ANALYSIS", priority: "HIGH", sortOrder: 2 },
  });

  const csdddCat2 = await prisma.requirementCategory.create({
    data: { regulationId: csddd.id, name: "Mensenrechten in Eigen Operatie", description: "Naleving van mensenrechten binnen eigen operaties.", sortOrder: 2 },
  });
  await prisma.requirement.create({
    data: { categoryId: csdddCat2.id, title: "Verbod op discriminatie", description: "Zorg dat er geen discriminatie plaatsvindt op basis van gender, etniciteit, religie, seksuele oriëntatie, leeftijd of handicap.", guidance: "Toets het HR-beleid, analyseer loondata. ILO-conventies 100 en 111.", evidenceType: "POLICY", priority: "HIGH", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: csdddCat2.id, title: "Vrijheid van vakvereniging", description: "Respecteer het recht van werknemers om vakbonden op te richten en collectief te onderhandelen.", guidance: "ILO-conventies 87 en 98.", evidenceType: "POLICY", priority: "MEDIUM", sortOrder: 2 },
  });
  await prisma.requirement.create({
    data: { categoryId: csdddCat2.id, title: "Verbod op dwangarbeid en kinderarbeid", description: "Zorg dat er geen dwangarbeid of kinderarbeid plaatsvindt in eigen operaties en bij directe leveranciers.", guidance: "ILO-conventies 29, 105, 138, 182. Voer audits uit bij leveranciers in risicosectoren.", evidenceType: "DOCUMENT", priority: "HIGH", sortOrder: 3 },
  });

  const csdddCat3 = await prisma.requirementCategory.create({
    data: { regulationId: csddd.id, name: "Waardeketen en Leveranciers", description: "Due diligence in de waardeketen en bij leveranciers.", sortOrder: 3 },
  });
  await prisma.requirement.create({
    data: { categoryId: csdddCat3.id, title: "Leveranciers-due diligence", description: "Voer due diligence uit op directe zakelijke partners. Neem contractuele waarborgen op.", guidance: "Contractclausules, gedragscodes voor leveranciers, audits of certificeringen.", evidenceType: "DOCUMENT", priority: "HIGH", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: csdddCat3.id, title: "Klachtenmechanisme", description: "Richt een klachtenmechanisme in waar getroffen personen en stakeholders zorgen kunnen melden.", guidance: "Moet toegankelijk zijn, vertrouwelijk, en leiden tot adequate follow-up.", evidenceType: "POLICY", priority: "MEDIUM", sortOrder: 2 },
  });

  const csdddCat4 = await prisma.requirementCategory.create({
    data: { regulationId: csddd.id, name: "Rapportage en Transparantie", description: "Jaarlijkse rapportage over due diligence-activiteiten.", sortOrder: 4 },
  });
  await prisma.requirement.create({
    data: { categoryId: csdddCat4.id, title: "Jaarlijkse due diligence rapportage", description: "Publiceer jaarlijks een rapport over het due diligence-proces, risico's, maatregelen en resultaten.", guidance: "Kan geïntegreerd worden in het CSRD-duurzaamheidsverslag.", evidenceType: "REPORT", priority: "HIGH", sortOrder: 1 },
  });

  // CSDDD Action Templates
  const csdddT1 = await prisma.actionTemplate.create({
    data: { regulationId: csddd.id, title: "Due diligence-framework opzetten", description: "Richt het governance- en beleidsframework in.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 45 },
  });
  for (const sub of [
    { title: "Projectteam en governance inrichten", description: "Wijs een verantwoordelijke aan en stel een werkgroep samen.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 14 },
    { title: "Due diligence-beleid opstellen", description: "Schrijf het formele beleidsdocument.", priority: "HIGH", sortOrder: 2, relativeDeadlineDays: 30 },
    { title: "Beleid laten goedkeuren door bestuur", description: "Presenteer het beleid aan het bestuur voor formele goedkeuring.", priority: "HIGH", sortOrder: 3, relativeDeadlineDays: 45 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: csddd.id, parentId: csdddT1.id } });
  }

  const csdddT2 = await prisma.actionTemplate.create({
    data: { regulationId: csddd.id, title: "Risico-analyse uitvoeren", description: "Breng mensenrechtenrisico's in kaart.", priority: "HIGH", sortOrder: 2, relativeDeadlineDays: 90 },
  });
  for (const sub of [
    { title: "Risico-mapping eigen operaties", description: "Breng alle mensenrechtenrisico's in kaart in eigen operaties.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 50 },
    { title: "Risico-mapping waardeketen", description: "Identificeer risico's bij directe zakelijke partners en leveranciers.", priority: "HIGH", sortOrder: 2, relativeDeadlineDays: 70 },
    { title: "Prioritering en actieplan", description: "Prioriteer risico's op ernst en waarschijnlijkheid.", priority: "HIGH", sortOrder: 3, relativeDeadlineDays: 90 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: csddd.id, parentId: csdddT2.id } });
  }

  const csdddT3 = await prisma.actionTemplate.create({
    data: { regulationId: csddd.id, title: "Maatregelen implementeren", description: "Implementeer maatregelen in de waardeketen.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 180 },
  });
  for (const sub of [
    { title: "Gedragscode voor leveranciers opstellen", description: "Stel een supplier code of conduct op.", priority: "MEDIUM", sortOrder: 1, relativeDeadlineDays: 60 },
    { title: "Contractclausules aanpassen", description: "Neem mensenrechten- en due diligence-clausules op in inkoopcontracten.", priority: "MEDIUM", sortOrder: 2, relativeDeadlineDays: 90 },
    { title: "Klachtenmechanisme inrichten", description: "Richt een toegankelijk klachtenmechanisme in.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 120 },
    { title: "Monitoring en audits opzetten", description: "Stel een monitoringprogramma op inclusief audits bij hoog-risico leveranciers.", priority: "MEDIUM", sortOrder: 4, relativeDeadlineDays: 180 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: csddd.id, parentId: csdddT3.id } });
  }

  const csdddT4 = await prisma.actionTemplate.create({
    data: { regulationId: csddd.id, title: "Rapportage en verantwoording", description: "Stel het jaarlijkse due diligence-rapport op.", priority: "HIGH", sortOrder: 4, relativeDeadlineDays: 365 },
  });
  for (const sub of [
    { title: "Due diligence-rapportage opstellen", description: "Stel het jaarlijkse rapport op.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 300 },
    { title: "Integratie met CSRD-rapportage", description: "Zorg voor consistentie met het CSRD-duurzaamheidsverslag.", priority: "MEDIUM", sortOrder: 2, relativeDeadlineDays: 330 },
    { title: "Publicatie en communicatie", description: "Publiceer het rapport en communiceer naar stakeholders.", priority: "HIGH", sortOrder: 3, relativeDeadlineDays: 365 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: csddd.id, parentId: csdddT4.id } });
  }

  // ============================================================
  // === REGULATION 6: Work-Life Balance Richtlijn ===
  // ============================================================
  const wlb = await prisma.regulation.create({
    data: {
      name: "Work-Life Balance Richtlijn",
      slug: "work-life-balance",
      description: "EU-richtlijn die minimumeisen stelt voor ouderschapsverlof, vaderschapsverlof, mantelzorgverlof en flexibel werken. Doel: gelijke verdeling van zorgtaken tussen mannen en vrouwen.",
      officialReference: "Richtlijn (EU) 2019/1158",
      authority: "Europese Commissie",
      effectiveDate: new Date("2022-08-02"),
      transpositionDate: new Date("2022-08-02"),
      category: "GENDER",
      scope: "Alle werkgevers in de EU, ongeacht grootte",
      applicableSectors: JSON.stringify(["GEMEENTE", "OVERHEID", "FINANCIEEL", "ONDERWIJS", "ZORG", "OVERIG"]),
      sourceUrl: "https://eur-lex.europa.eu/eli/dir/2019/1158/oj/eng",
      penaltyInfo: "Sancties vastgesteld door lidstaten. In NL: Wet Arbeid en Zorg is de implementatie.",
      isActive: true,
    },
  });

  // WLB Categories & Requirements
  const wlbCat1 = await prisma.requirementCategory.create({
    data: { regulationId: wlb.id, name: "Verlofrechten", description: "Minimumeisen voor ouderschaps-, geboorte- en mantelzorgverlof.", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: wlbCat1.id, title: "Ouderschapsverlof", description: "Elke werknemer heeft recht op minimaal 4 maanden ouderschapsverlof per kind, waarvan 2 maanden niet-overdraagbaar en betaald.", guidance: "In NL: 26 weken ouderschapsverlof, waarvan 9 weken betaald (70% dagloon).", evidenceType: "POLICY", priority: "HIGH", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: wlbCat1.id, title: "Geboorteverlof / vaderschapsverlof", description: "De tweede ouder heeft recht op minimaal 10 werkdagen betaald verlof rond de geboorte.", guidance: "In NL: 5 dagen geboorteverlof (100% doorbetaald) + 5 weken aanvullend (70% via UWV).", evidenceType: "POLICY", priority: "HIGH", sortOrder: 2 },
  });
  await prisma.requirement.create({
    data: { categoryId: wlbCat1.id, title: "Mantelzorgverlof", description: "Werknemers hebben recht op minimaal 5 werkdagen mantelzorgverlof per jaar.", guidance: "In NL: kortdurend zorgverlof (2 weken per jaar, 70% doorbetaald) en langdurend zorgverlof (6 weken, onbetaald).", evidenceType: "POLICY", priority: "MEDIUM", sortOrder: 3 },
  });

  const wlbCat2 = await prisma.requirementCategory.create({
    data: { regulationId: wlb.id, name: "Flexibel Werken", description: "Recht op flexibele werkregelingen en bescherming tegen benadeling.", sortOrder: 2 },
  });
  await prisma.requirement.create({
    data: { categoryId: wlbCat2.id, title: "Recht op flexibele werkregelingen", description: "Ouders van kinderen tot 8 jaar en mantelzorgers mogen flexibele werkregelingen aanvragen.", guidance: "In NL: Wet Flexibel Werken. Werkgever mag alleen weigeren bij zwaarwegend bedrijfsbelang.", evidenceType: "POLICY", priority: "MEDIUM", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: wlbCat2.id, title: "Bescherming tegen benadeling", description: "Werknemers die verlof opnemen of flexibel werken aanvragen mogen niet worden benadeeld.", guidance: "Documenteer hoe deze bescherming is gewaarborgd.", evidenceType: "POLICY", priority: "HIGH", sortOrder: 2 },
  });

  const wlbCat3 = await prisma.requirementCategory.create({
    data: { regulationId: wlb.id, name: "Monitoring en Communicatie", description: "Monitoring van verlofopname en communicatie naar medewerkers.", sortOrder: 3 },
  });
  await prisma.requirement.create({
    data: { categoryId: wlbCat3.id, title: "Verlofopname monitoren per gender", description: "Monitor en rapporteer de opname van ouderschaps-, geboorte- en zorgverlof per gender.", guidance: "Analyseer of mannen daadwerkelijk verlof opnemen.", evidenceType: "DATA_ANALYSIS", priority: "MEDIUM", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: wlbCat3.id, title: "Interne communicatie verlofrechten", description: "Informeer alle medewerkers actief over hun verlofrechten en aanvraagprocedure.", guidance: "Gebruik intranet, onboarding materiaal en HR-communicatie.", evidenceType: "DOCUMENT", priority: "LOW", sortOrder: 2 },
  });

  // WLB Action Templates
  const wlbT1 = await prisma.actionTemplate.create({
    data: { regulationId: wlb.id, title: "Beleid toetsen en aanpassen", description: "Toets het huidige verlofbeleid aan de richtlijn.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 30 },
  });
  for (const sub of [
    { title: "Huidige verlofbeleid inventariseren", description: "Breng het huidige beleid in kaart voor alle verlofvormen.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 10 },
    { title: "Gap-analyse met richtlijn", description: "Vergelijk het beleid met de minimumeisen van de richtlijn.", priority: "HIGH", sortOrder: 2, relativeDeadlineDays: 20 },
    { title: "Beleid aanpassen", description: "Pas het verlof- en flexibel-werkenbeleid aan waar het niet voldoet.", priority: "HIGH", sortOrder: 3, relativeDeadlineDays: 30 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: wlb.id, parentId: wlbT1.id } });
  }

  const wlbT2 = await prisma.actionTemplate.create({
    data: { regulationId: wlb.id, title: "Communicatie en implementatie", description: "Informeer en train leidinggevenden en medewerkers.", priority: "MEDIUM", sortOrder: 2, relativeDeadlineDays: 60 },
  });
  for (const sub of [
    { title: "Aanvraagprocedure flexibel werken beschrijven", description: "Stel een heldere procedure op voor het aanvragen van flexibele werkregelingen.", priority: "MEDIUM", sortOrder: 1, relativeDeadlineDays: 25 },
    { title: "Leidinggevenden informeren", description: "Train leidinggevenden in de rechten van medewerkers.", priority: "MEDIUM", sortOrder: 2, relativeDeadlineDays: 40 },
    { title: "Medewerkers informeren", description: "Communiceer het verlofbeleid aan alle medewerkers.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 50 },
    { title: "Bescherming tegen benadeling borgen", description: "Controleer dat medewerkers die verlof opnemen niet worden benadeeld.", priority: "HIGH", sortOrder: 4, relativeDeadlineDays: 60 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: wlb.id, parentId: wlbT2.id } });
  }

  const wlbT3 = await prisma.actionTemplate.create({
    data: { regulationId: wlb.id, title: "Monitoring verlofopname", description: "Richt monitoring in voor verlofopname per gender.", priority: "LOW", sortOrder: 3, relativeDeadlineDays: 180 },
  });
  for (const sub of [
    { title: "Data-registratie inrichten", description: "Zorg dat het HR-systeem verlofopname per type en gender registreert.", priority: "MEDIUM", sortOrder: 1, relativeDeadlineDays: 45 },
    { title: "Eerste halfjaarlijkse meting", description: "Analyseer na 6 maanden de verlofopname per gender.", priority: "LOW", sortOrder: 2, relativeDeadlineDays: 180 },
    { title: "Interventies bij scheefgroei", description: "Onderzoek culturele barrières als mannelijke medewerkers minder verlof opnemen.", priority: "LOW", sortOrder: 3, relativeDeadlineDays: 180 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: wlb.id, parentId: wlbT3.id } });
  }

  // ============================================================
  // === REGULATION 7: Wet Toezicht Gelijke Kansen ===
  // ============================================================
  const wgk = await prisma.regulation.create({
    data: {
      name: "Wet Toezicht Gelijke Kansen bij Werving en Selectie",
      slug: "wet-gelijke-kansen-werving",
      description: "Nederlandse wet die werkgevers verplicht een werkwijze te hebben die gelijke kansen bij werving en selectie waarborgt en discriminatie voorkomt. De Arbeidsinspectie krijgt toezichtsbevoegdheden.",
      officialReference: "Wet Toezicht Gelijke Kansen bij Werving en Selectie (Stb. 2024)",
      authority: "Nederlandse overheid",
      effectiveDate: new Date("2025-07-01"),
      category: "DIVERSITEIT",
      scope: "Alle werkgevers met 25+ medewerkers. Uitzendbureaus en intermediairs altijd.",
      applicableSectors: JSON.stringify(["GEMEENTE", "OVERHEID", "FINANCIEEL", "ONDERWIJS", "ZORG", "OVERIG"]),
      sourceUrl: "https://www.eerstekamer.nl/wetsvoorstel/35673_wet_toezicht_gelijke_kansen",
      penaltyInfo: "Boetes door Arbeidsinspectie. Handhaving start juli 2027.",
      isActive: true,
    },
  });

  // WGK Categories & Requirements
  const wgkCat1 = await prisma.requirementCategory.create({
    data: { regulationId: wgk.id, name: "Werkwijze en Procedures", description: "Schriftelijke werkwijze voor gelijke kansen bij werving en selectie.", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: wgkCat1.id, title: "Schriftelijke werkwijze werving en selectie", description: "Stel een schriftelijke werkwijze op die beschrijft hoe gelijke kansen worden gewaarborgd.", guidance: "De werkwijze moet bevatten: hoe vacatures worden opgesteld, selectiecriteria, sollicitatiegesprekken en beslissingen.", evidenceType: "POLICY", priority: "HIGH", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: wgkCat1.id, title: "Objectieve selectiecriteria", description: "Gebruik alleen functie-relevante, objectieve en niet-discriminerende selectiecriteria.", guidance: "Vermijd criteria die indirect discriminerend kunnen zijn.", evidenceType: "POLICY", priority: "HIGH", sortOrder: 2 },
  });

  const wgkCat2 = await prisma.requirementCategory.create({
    data: { regulationId: wgk.id, name: "Bewustwording en Training", description: "Training en bewustwording over het voorkomen van discriminatie.", sortOrder: 2 },
  });
  await prisma.requirement.create({
    data: { categoryId: wgkCat2.id, title: "Training wervingsmedewerkers", description: "Zorg dat alle medewerkers betrokken bij werving en selectie getraind zijn in het herkennen en voorkomen van discriminatie.", guidance: "Training over: bias in selectie, discriminatiegronden (AWGB), en hoe de werkwijze toe te passen.", evidenceType: "TRAINING", priority: "MEDIUM", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: wgkCat2.id, title: "Interne bewustwording discriminatieverbod", description: "Zorg dat alle leidinggevenden en HR-medewerkers op de hoogte zijn van het discriminatieverbod.", guidance: "Integreer in onboarding en jaarlijkse compliance training.", evidenceType: "TRAINING", priority: "MEDIUM", sortOrder: 2 },
  });

  const wgkCat3 = await prisma.requirementCategory.create({
    data: { regulationId: wgk.id, name: "Monitoring en Klachten", description: "Klachtenprocedure en monitoring van de werkwijze.", sortOrder: 3 },
  });
  await prisma.requirement.create({
    data: { categoryId: wgkCat3.id, title: "Klachtenprocedure discriminatie", description: "Richt een laagdrempelige klachtenprocedure in voor sollicitanten en medewerkers.", guidance: "Moet bevatten: waar te melden, wie behandelt de klacht, termijnen, en bescherming tegen benadeling.", evidenceType: "POLICY", priority: "HIGH", sortOrder: 1 },
  });
  await prisma.requirement.create({
    data: { categoryId: wgkCat3.id, title: "Monitoring en evaluatie werkwijze", description: "Evalueer de werkwijze periodiek. De Arbeidsinspectie kan de werkwijze opvragen.", guidance: "Houd bij: aantal sollicitaties per vacature, diversiteit in kandidatenpool, en uitkomsten per fase.", evidenceType: "DATA_ANALYSIS", priority: "MEDIUM", sortOrder: 2 },
  });

  // WGK Action Templates
  const wgkT1 = await prisma.actionTemplate.create({
    data: { regulationId: wgk.id, title: "Werkwijze opstellen", description: "Stel een schriftelijke werkwijze op voor gelijke kansen.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 30 },
  });
  for (const sub of [
    { title: "Huidige wervingsprocessen inventariseren", description: "Breng het huidige wervings- en selectieproces in kaart.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 10 },
    { title: "Schriftelijke werkwijze opstellen", description: "Schrijf een werkwijze die gelijke kansen waarborgt in elke fase.", priority: "HIGH", sortOrder: 2, relativeDeadlineDays: 20 },
    { title: "Werkwijze laten goedkeuren", description: "Laat goedkeuren door HR-directie en OR.", priority: "HIGH", sortOrder: 3, relativeDeadlineDays: 30 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: wgk.id, parentId: wgkT1.id } });
  }

  const wgkT2 = await prisma.actionTemplate.create({
    data: { regulationId: wgk.id, title: "Training en bewustwording", description: "Train alle betrokken medewerkers.", priority: "MEDIUM", sortOrder: 2, relativeDeadlineDays: 60 },
  });
  for (const sub of [
    { title: "Training selecteren of ontwikkelen", description: "Selecteer of ontwikkel een training over bias-vrij werven.", priority: "MEDIUM", sortOrder: 1, relativeDeadlineDays: 30 },
    { title: "Eerste trainingsronde uitvoeren", description: "Train alle recruiters, hiring managers en HR-medewerkers.", priority: "MEDIUM", sortOrder: 2, relativeDeadlineDays: 50 },
    { title: "Terugkerende training plannen", description: "Plan jaarlijkse herhaaltraining.", priority: "LOW", sortOrder: 3, relativeDeadlineDays: 60 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: wgk.id, parentId: wgkT2.id } });
  }

  const wgkT3 = await prisma.actionTemplate.create({
    data: { regulationId: wgk.id, title: "Klachtenprocedure en monitoring", description: "Richt klachtenprocedure en monitoring in.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 90 },
  });
  for (const sub of [
    { title: "Klachtenprocedure inrichten", description: "Stel een laagdrempelige klachtenprocedure in.", priority: "HIGH", sortOrder: 1, relativeDeadlineDays: 30 },
    { title: "Monitoring diversiteit kandidatenpool", description: "Begin met het monitoren van diversiteit in sollicitantenbestanden.", priority: "MEDIUM", sortOrder: 2, relativeDeadlineDays: 60 },
    { title: "Jaarlijkse evaluatie werkwijze", description: "Evalueer de werkwijze jaarlijks op basis van data en klachten.", priority: "MEDIUM", sortOrder: 3, relativeDeadlineDays: 90 },
  ]) {
    await prisma.actionTemplate.create({ data: { ...sub, regulationId: wgk.id, parentId: wgkT3.id } });
  }

  // ============================================================
  // === COMPLIANCE STATUS for Gemeente Arnhem ===
  // ============================================================
  const allGepReqs = await prisma.requirement.findMany({
    where: { category: { regulationId: gep.id } },
    orderBy: { sortOrder: "asc" },
  });
  const gepStatuses = ["COMPLIANT", "COMPLIANT", "IN_PROGRESS", "COMPLIANT", "COMPLIANT", "IN_PROGRESS", "NOT_STARTED", "NOT_STARTED", "NOT_STARTED"];
  for (let i = 0; i < allGepReqs.length; i++) {
    await prisma.complianceStatus.create({
      data: {
        organizationId: arnhem.id,
        requirementId: allGepReqs[i].id,
        status: gepStatuses[i],
        notes: gepStatuses[i] === "COMPLIANT" ? "Voldoet aan vereiste." : gepStatuses[i] === "IN_PROGRESS" ? "Wordt momenteel opgepakt." : null,
        completedAt: gepStatuses[i] === "COMPLIANT" ? new Date() : null,
      },
    });
  }

  const allPayReqs = await prisma.requirement.findMany({
    where: { category: { regulationId: payDir.id } },
    orderBy: { sortOrder: "asc" },
  });
  const payStatuses = ["IN_PROGRESS", "NOT_STARTED", "NOT_STARTED", "NOT_STARTED", "UNDER_REVIEW", "NOT_STARTED"];
  for (let i = 0; i < allPayReqs.length; i++) {
    await prisma.complianceStatus.create({
      data: {
        organizationId: arnhem.id,
        requirementId: allPayReqs[i].id,
        status: payStatuses[i],
        notes: payStatuses[i] !== "NOT_STARTED" ? "In behandeling bij HR-afdeling." : null,
      },
    });
  }

  // Compliance statuses for new regulations (Arnhem) - all start at NOT_STARTED with some IN_PROGRESS
  for (const reg of [wlb, wgk]) {
    const reqs = await prisma.requirement.findMany({
      where: { category: { regulationId: reg.id } },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    });
    for (let i = 0; i < reqs.length; i++) {
      // First 2 requirements of each new regulation: IN_PROGRESS, rest: NOT_STARTED
      const status = i < 2 ? "IN_PROGRESS" : "NOT_STARTED";
      await prisma.complianceStatus.create({
        data: {
          organizationId: arnhem.id,
          requirementId: reqs[i].id,
          status,
          notes: status === "IN_PROGRESS" ? "Recent gestart met implementatie." : null,
        },
      });
    }
  }

  // ============================================================
  // === ORGANIZATION-REGULATION LINKS ===
  // ============================================================

  // Gemeente Arnhem: GEP + Pay Transparency + Work-Life Balance + Wet Gelijke Kansen
  for (const reg of [gep, payDir, wlb, wgk]) {
    await prisma.organizationRegulation.create({
      data: { organizationId: arnhem.id, regulationId: reg.id, isActive: true },
    });
  }

  // Gemeente Wageningen: same as Arnhem
  for (const reg of [gep, payDir, wlb, wgk]) {
    await prisma.organizationRegulation.create({
      data: { organizationId: wageningen.id, regulationId: reg.id, isActive: true },
    });
  }

  // Voorbeeld Bedrijf: Pay Transparency + Women on Boards + CSRD + CSDDD + Work-Life Balance + Wet Gelijke Kansen
  for (const reg of [payDir, wob, csrd, csddd, wlb, wgk]) {
    await prisma.organizationRegulation.create({
      data: { organizationId: bedrijf.id, regulationId: reg.id, isActive: true },
    });
  }

  // Compliance statuses for Voorbeeld Bedrijf — mix of statuses
  for (const reg of [payDir, wob, csrd, csddd, wlb, wgk]) {
    const reqs = await prisma.requirement.findMany({
      where: { category: { regulationId: reg.id } },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    });
    for (let i = 0; i < reqs.length; i++) {
      let status: string;
      if (i === 0) status = "COMPLIANT";
      else if (i === 1) status = "IN_PROGRESS";
      else if (i === 2) status = "UNDER_REVIEW";
      else status = "NOT_STARTED";
      await prisma.complianceStatus.create({
        data: {
          organizationId: bedrijf.id,
          requirementId: reqs[i].id,
          status,
          notes: status === "COMPLIANT" ? "Voldoet aan vereiste." : status === "IN_PROGRESS" ? "Wordt opgepakt door HR." : null,
          completedAt: status === "COMPLIANT" ? new Date() : null,
        },
      });
    }
  }

  // ============================================================
  // === DASHBOARD DATA for Gemeente Arnhem ===
  // ============================================================
  await prisma.dashboardData.create({
    data: {
      organizationId: arnhem.id,
      category: "gender_per_functieniveau",
      year: 2024,
      data: JSON.stringify({
        labels: ["2019", "2020", "2021", "2022", "2023", "2024"],
        datasets: [
          { label: "Directie", data: [22, 23, 24, 25, 27, 28] },
          { label: "Management", data: [30, 31, 32, 33, 35, 36] },
          { label: "Senior", data: [38, 39, 40, 41, 42, 43] },
          { label: "Medior", data: [48, 49, 50, 51, 51, 52] },
          { label: "Junior", data: [51, 52, 52, 53, 53, 54] },
        ],
      }),
      importedBy: "admin@revact.ai",
    },
  });

  await prisma.dashboardData.create({
    data: {
      organizationId: arnhem.id,
      category: "gender_per_afdeling",
      year: 2024,
      data: JSON.stringify({
        labels: ["Burgerzaken", "Sociale Zaken", "Ruimtelijke Ordening", "ICT", "Financiën", "Juridisch", "Communicatie"],
        datasets: [
          { label: "% Vrouwen", data: [58, 62, 35, 22, 44, 48, 65] },
          { label: "% Mannen", data: [42, 38, 65, 78, 56, 52, 35] },
        ],
      }),
      importedBy: "admin@revact.ai",
    },
  });

  await prisma.dashboardData.create({
    data: {
      organizationId: arnhem.id,
      category: "contractvorm_per_gender",
      year: 2024,
      data: JSON.stringify({
        labels: ["Vast", "Tijdelijk", "Parttime"],
        datasets: [
          { label: "Vrouwen", data: [55, 25, 20] },
          { label: "Mannen", data: [72, 18, 10] },
        ],
      }),
      importedBy: "admin@revact.ai",
    },
  });

  // ============================================================
  // === GENERATE ACTION PLANS ===
  // ============================================================

  // Generate action plans for Gemeente Arnhem (all 4 regulations)
  await generateActionPlan(prisma, arnhem.id, gep.id);
  await generateActionPlan(prisma, arnhem.id, payDir.id);
  await generateActionPlan(prisma, arnhem.id, wlb.id);
  await generateActionPlan(prisma, arnhem.id, wgk.id);

  // Generate action plans for Voorbeeld Bedrijf (all 6 regulations)
  await generateActionPlan(prisma, bedrijf.id, payDir.id);
  await generateActionPlan(prisma, bedrijf.id, wob.id);
  await generateActionPlan(prisma, bedrijf.id, csrd.id);
  await generateActionPlan(prisma, bedrijf.id, csddd.id);
  await generateActionPlan(prisma, bedrijf.id, wlb.id);
  await generateActionPlan(prisma, bedrijf.id, wgk.id);

  // Set some subtasks to DONE and assign users (Arnhem GEP)
  const arnhemActions = await prisma.actionItem.findMany({
    where: { organizationId: arnhem.id, regulationId: gep.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const parentActions = arnhemActions.filter((a) => !a.parentId);
  const parent1 = parentActions.find((a) => a.sortOrder === 1)!;
  const parent2 = parentActions.find((a) => a.sortOrder === 2)!;

  const parent1Subs = arnhemActions.filter((a) => a.parentId === parent1.id).sort((a, b) => a.sortOrder - b.sortOrder);
  const parent2Subs = arnhemActions.filter((a) => a.parentId === parent2.id).sort((a, b) => a.sortOrder - b.sortOrder);

  for (const sub of [parent1Subs[0], parent1Subs[1], parent1Subs[2]]) {
    await prisma.actionItem.update({ where: { id: sub.id }, data: { status: "DONE" } });
  }
  await prisma.actionItem.update({ where: { id: parent2Subs[0].id }, data: { status: "DONE" } });

  await prisma.actionItem.update({ where: { id: parent1.id }, data: { assignedToId: lisa.id } });
  for (const sub of parent1Subs) {
    await prisma.actionItem.update({ where: { id: sub.id }, data: { assignedToId: lisa.id } });
  }

  await prisma.actionItem.update({ where: { id: parent2.id }, data: { assignedToId: jan.id } });
  for (const sub of parent2Subs) {
    await prisma.actionItem.update({ where: { id: sub.id }, data: { assignedToId: jan.id } });
  }

  // ============================================================
  // === COMPLIANCE DOCUMENTS (for Arnhem) ===
  // ============================================================
  await prisma.complianceDocument.createMany({
    data: [
      {
        organizationId: arnhem.id,
        regulationId: gep.id,
        title: "Gender Equality Plan 2024-2027",
        description: "Officieel GEP-document goedgekeurd door het college van B&W",
        url: "https://www.arnhem.nl/gep-2024-2027",
        type: "POLICY",
        isPublic: true,
        sortOrder: 1,
      },
      {
        organizationId: arnhem.id,
        regulationId: gep.id,
        title: "Horizon Europe GEP Vereisten",
        description: "Officiële richtlijnen van de Europese Commissie voor GEP-vereisten",
        url: "https://research-and-innovation.ec.europa.eu/strategy/strategy-2020-2024/democracy-and-rights/gender-equality-research-and-innovation_en",
        type: "LINK",
        isPublic: true,
        sortOrder: 2,
      },
      {
        organizationId: arnhem.id,
        regulationId: gep.id,
        title: "Jaarrapportage Gendergelijkheid 2025",
        description: "Voortgangsrapportage over de implementatie van het GEP",
        url: "https://www.arnhem.nl/rapportage-gender-2025",
        type: "REPORT",
        isPublic: true,
        sortOrder: 3,
      },
      {
        organizationId: arnhem.id,
        regulationId: payDir.id,
        title: "EU Pay Transparency Directive (2023/970)",
        description: "Volledige tekst van de EU-richtlijn belonings­transparantie",
        url: "https://eur-lex.europa.eu/legal-content/NL/TXT/?uri=CELEX:32023L0970",
        type: "LINK",
        isPublic: true,
        sortOrder: 4,
      },
      {
        organizationId: arnhem.id,
        regulationId: payDir.id,
        title: "Beloningsbeleid Gemeente Arnhem",
        description: "Beleidskader voor transparante en eerlijke beloning",
        url: "https://www.arnhem.nl/beloningsbeleid",
        type: "POLICY",
        isPublic: true,
        sortOrder: 5,
      },
      {
        organizationId: arnhem.id,
        regulationId: null,
        title: "Diversiteits- en Inclusiebeleid",
        description: "Overkoepelend D&I-beleid van de gemeente",
        url: "https://www.arnhem.nl/diversiteit-inclusie",
        type: "POLICY",
        isPublic: true,
        sortOrder: 6,
      },
    ],
  });

  console.log("Seed data created successfully!");
  console.log("  7 regulations created:");
  console.log("    1. Gender Equality Plan (Horizon Europe)");
  console.log("    2. Beloningsstructuur Richtlijn (EU Pay Transparency)");
  console.log("    3. Women on Boards Directive");
  console.log("    4. CSRD Sociale Rapportage (ESG)");
  console.log("    5. Corporate Sustainability Due Diligence (CSDDD)");
  console.log("    6. Work-Life Balance Richtlijn");
  console.log("    7. Wet Toezicht Gelijke Kansen bij Werving en Selectie");
  console.log("  Organization assignments:");
  console.log("    - Gemeente Arnhem: 4 regulations (GEP, Pay, WLB, WGK)");
  console.log("    - Gemeente Wageningen: 4 regulations (GEP, Pay, WLB, WGK)");
  console.log("    - Voorbeeld Bedrijf: 6 regulations (Pay, WoB, CSRD, CSDDD, WLB, WGK)");
  console.log(`  Action plans generated for Arnhem and Voorbeeld Bedrijf`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
