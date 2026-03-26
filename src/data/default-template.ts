import type { TemplateSection, TemplateItem, ProjectConfig, ProjectMetadata } from '@/types';

const reg7: TemplateSection = {
  title: 'Regulation 7 — Materials and Workmanship',
  key: 'reg7',
  items: [
    { ref: 'REG7.1', text: 'Materials used are adequate and appropriate for their intended purpose and comply with Regulation 7', section: 'reg7' },
    { ref: 'REG7.2', text: 'Materials are CE/UKCA marked where required and accompanied by Declarations of Performance', section: 'reg7' },
    { ref: 'REG7.3', text: 'Workmanship is of an adequate standard — installations follow manufacturer\'s instructions and relevant codes of practice', section: 'reg7' },
    { ref: 'REG7.4', text: 'Short-lived materials are not used in a manner that would compromise compliance with other requirements', section: 'reg7' },
    { ref: 'REG7.5', text: 'Materials and products have appropriate third-party certification where applicable (e.g. BBA, LABC, BRE)', section: 'reg7' },
  ],
};

const partA: TemplateSection = {
  title: 'Part A — Structure',
  key: 'partA',
  items: [
    { ref: 'A.1', text: 'Structural works proceeding per approved structural engineer drawings and specifications', section: 'partA' },
    { ref: 'A.2', text: 'Temporary works / propping in place where required during structural alterations', section: 'partA' },
    { ref: 'A.3', text: 'Steel connections and fixings match structural engineer\'s details', section: 'partA' },
    { ref: 'A.4', text: 'Foundation works (if applicable) match approved design and site conditions', section: 'partA' },
    { ref: 'A.5', text: 'Structural elements adequate for imposed, dead and wind loading', section: 'partA' },
  ],
};

const partB1: TemplateSection = {
  title: 'Part B — B1 Means of Warning and Escape',
  key: 'partB1',
  items: [
    { ref: 'B1.1', text: 'Fire alarm system installed to correct category per BS 5839-1:2017 — detection heads, call points, sounders, panel locations match approved layout', section: 'partB1' },
    { ref: 'B1.2', text: 'Fire alarm coverage extends to all areas including external terraces/balconies', section: 'partB1' },
    { ref: 'B1.3', text: 'Emergency lighting installed per BS 5266-1:2016 — luminaires on escape routes, staircases, direction/level changes', section: 'partB1' },
    { ref: 'B1.4', text: 'Emergency lighting covers all external escape areas', section: 'partB1' },
    { ref: 'B1.5', text: 'Emergency lighting duration test evidence available (3-hour)', section: 'partB1' },
    { ref: 'B1.6', text: 'Fire safety signage per BS 5499-4:2013 / BS ISO 3864-1 — every escape route, staircase, final exit, directional change', section: 'partB1' },
    { ref: 'B1.7', text: 'Exit signs illuminated/photoluminescent and visible from required distances', section: 'partB1' },
    { ref: 'B1.8', text: 'Fire action notices at each floor level adjacent to call points', section: 'partB1' },
    { ref: 'B1.9', text: 'Fire/smoke curtains (if applicable) — manufacturer details, fire certification, closing protocol, battery back-up confirmed', section: 'partB1' },
    { ref: 'B1.10', text: 'Fire door sets installed per manufacturer details with certification to BS 476-22 or BS EN 1634-1:3 — intumescent strips, cold smoke seals, self-closing devices', section: 'partB1' },
    { ref: 'B1.11', text: 'Escape route doors fitted with push bars / simple fastenings readily openable', section: 'partB1' },
    { ref: 'B1.12', text: 'Doors opening inwards on escape routes — occupancy confirmed not exceeding 60 per storey exit', section: 'partB1' },
    { ref: 'B1.13', text: 'Electronic locks / hold-open devices failsafe with break glass, manual release, linked to fire alarm per BS 7273-4:2015', section: 'partB1' },
    { ref: 'B1.14', text: 'No unauthorised storage or obstructions within protected stairways (AD B para 3.38)', section: 'partB1' },
    { ref: 'B1.15', text: 'Places of special fire hazard — enclosed with fire-resisting construction, ventilated protected lobbies where required', section: 'partB1' },
    { ref: 'B1.16', text: 'Disabled refuge / EVC system provision reviewed per BS 5839-9:2003', section: 'partB1' },
    { ref: 'B1.17', text: 'Travel distances within limits — single direction ≤18m / multi-direction ≤45m (office)', section: 'partB1' },
    { ref: 'B1.18', text: 'Protected stairway lobbies intact and not compromised by works', section: 'partB1' },
  ],
};

const partB2: TemplateSection = {
  title: 'Part B — B2 Internal Fire Spread (Linings)',
  key: 'partB2',
  items: [
    { ref: 'B2.1', text: 'Wall and ceiling linings comply with AD B Vol 2 Table 6.1 — Class 0/1 on escape routes', section: 'partB2' },
    { ref: 'B2.2', text: 'Thermoplastic materials used in lighting diffusers and rooflights comply with limitations in AD B', section: 'partB2' },
  ],
};

const partB3: TemplateSection = {
  title: 'Part B — B3 Internal Fire Spread (Structure)',
  key: 'partB3',
  items: [
    { ref: 'B3.1', text: 'Elements of structure achieving required period of fire resistance (typically 60 min) — method of protection confirmed', section: 'partB3' },
    { ref: 'B3.2', text: 'Fire protection to riser shafts confirmed and intact', section: 'partB3' },
    { ref: 'B3.3', text: 'Cavity barriers in concealed spaces per AD B Vol 2 Section 9 — locations, type, fixings confirmed', section: 'partB3' },
    { ref: 'B3.4', text: 'Raised access floor voids — cavity barrier provision reviewed', section: 'partB3' },
    { ref: 'B3.5', text: 'Fire/smoke dampers where ductwork passes into means of escape — linked to fire alarm or enclosed in fire-rated ductwork', section: 'partB3' },
    { ref: 'B3.6', text: 'Services penetrating compartment walls/floors/ceilings fire stopped with appropriate materials — intumescent collars/wraps', section: 'partB3' },
    { ref: 'B3.7', text: 'Fire stopping and cavity barrier installation by 3rd-party accredited body — certification and tag log available on site', section: 'partB3' },
    { ref: 'B3.8', text: 'Compartmentation maintained — no unprotected openings between compartments', section: 'partB3' },
  ],
};

const partB4: TemplateSection = {
  title: 'Part B — B4 External Fire Spread',
  key: 'partB4',
  items: [
    { ref: 'B4.1', text: 'External wall materials and construction adjacent boundary do not contribute to fire spread', section: 'partB4' },
    { ref: 'B4.2', text: 'Roof coverings and terrace materials comply with AD B requirements', section: 'partB4' },
    { ref: 'B4.3', text: 'Space separation — unprotected areas within acceptable limits for distance to boundary', section: 'partB4' },
  ],
};

const partB5: TemplateSection = {
  title: 'Part B — B5 Access and Facilities for Fire Service',
  key: 'partB5',
  items: [
    { ref: 'B5.1', text: 'Fire service access arrangements maintained and clear', section: 'partB5' },
    { ref: 'B5.2', text: 'Dry/wet riser connections accessible (if applicable)', section: 'partB5' },
    { ref: 'B5.3', text: 'Fire service vehicle access to building perimeter maintained', section: 'partB5' },
    { ref: 'B5.4', text: 'Fire main inlet and outlet locations identified and accessible', section: 'partB5' },
  ],
};

const reg38: TemplateSection = {
  title: 'Regulation 38 — Fire Safety Information',
  key: 'reg38',
  items: [
    { ref: 'R38.1', text: 'Regulation 38 fire safety information pack being compiled for handover before completion/occupation', section: 'reg38' },
    { ref: 'R38.2', text: 'Pack to include: fire strategy, as-built plans, detection/alarm layouts, emergency lighting/signage, escape routes, hydrant locations, management strategy, passive provisions, fire service access', section: 'reg38' },
    { ref: 'R38.3', text: 'Responsible person acknowledgement declaration prepared for completion', section: 'reg38' },
  ],
};

const partC: TemplateSection = {
  title: 'Part C — Site Preparation and Resistance to Contaminants and Moisture',
  key: 'partC',
  items: [
    { ref: 'C.1', text: 'Site adequately prepared — subsoil drainage where necessary (C1)', section: 'partC' },
    { ref: 'C.2', text: 'Measures to resist contaminants including radon where applicable (C1)', section: 'partC' },
    { ref: 'C.3', text: 'New roof / external envelope works demonstrate resistance to rainfall and interstitial/surface condensation (C2)', section: 'partC' },
    { ref: 'C.4', text: 'Completed roof/envelope works weathertight on site (C2)', section: 'partC' },
    { ref: 'C.5', text: 'Walls adequately resist moisture penetration — DPCs, cavity trays, weep holes where applicable (C2)', section: 'partC' },
    { ref: 'C.6', text: 'Floors resist moisture from the ground — DPMs correctly installed and lapped (C2)', section: 'partC' },
  ],
};

const partD: TemplateSection = {
  title: 'Part D — Toxic Substances',
  key: 'partD',
  items: [
    { ref: 'D.1', text: 'Cavity wall insulation (if applicable) installed to minimise fumes entering the building', section: 'partD' },
    { ref: 'D.2', text: 'Urea formaldehyde foam insulation not used in inappropriate locations', section: 'partD' },
  ],
};

const partE: TemplateSection = {
  title: 'Part E — Resistance to Passage of Sound',
  key: 'partE',
  items: [
    { ref: 'E.1', text: 'Sound insulation between separating walls/floors meets requirements (if applicable — e.g. mixed-use buildings)', section: 'partE' },
    { ref: 'E.2', text: 'Internal walls and floors between different use areas provide adequate sound resistance', section: 'partE' },
    { ref: 'E.3', text: 'Pre-completion sound testing arranged where required', section: 'partE' },
  ],
};

const partF: TemplateSection = {
  title: 'Part F — Ventilation',
  key: 'partF',
  items: [
    { ref: 'F.1', text: 'Ventilation strategy covers: design rates for occupiable rooms, extract for sanitary/showers, purge ventilation, natural ventilation details', section: 'partF' },
    { ref: 'F.2', text: 'HVAC installation meets AD F requirements — commissioned per Section 4', section: 'partF' },
    { ref: 'F.3', text: 'Air tightness testing arranged/completed', section: 'partF' },
    { ref: 'F.4', text: 'Ventilation systems have accessible controls and are adequately labelled for maintenance', section: 'partF' },
    { ref: 'F.5', text: 'Adequate means of ventilation provided to common areas and circulation spaces', section: 'partF' },
  ],
};

const partG: TemplateSection = {
  title: 'Part G — Sanitation, Hot Water Safety and Water Efficiency',
  key: 'partG',
  items: [
    { ref: 'G.1', text: 'Wholesome/softened cold water supply provided per AD G Appendix B (G1)', section: 'partG' },
    { ref: 'G.2', text: 'Hot water provision to wash basins, showers and food preparation sinks confirmed (G3)', section: 'partG' },
    { ref: 'G.3', text: 'Hot water systems designed to prevent scalding — thermostatic mixing valves where required (G3)', section: 'partG' },
    { ref: 'G.4', text: 'Sanitary provisions adequate for proposed occupancy per BS 6465 (G4)', section: 'partG' },
    { ref: 'G.5', text: 'Sanitary conveniences separated from food preparation areas by a ventilated space (G4)', section: 'partG' },
    { ref: 'G.6', text: 'Bathrooms and kitchens have adequate washing facilities (G5/G6)', section: 'partG' },
  ],
};

const partH: TemplateSection = {
  title: 'Part H — Drainage and Waste Disposal',
  key: 'partH',
  items: [
    { ref: 'H.1', text: 'Foul drainage layout — pipe materials, sizes, falls, bedding, ventilation, outfall, MH/IC schedule match approved details (H1)', section: 'partH' },
    { ref: 'H.2', text: 'Surface water / rainwater drainage arrangements confirmed and match approved details (H3)', section: 'partH' },
    { ref: 'H.3', text: 'Separate systems for foul and surface water where required (H1/H3)', section: 'partH' },
    { ref: 'H.4', text: 'Access points for clearing blockages provided at appropriate locations (H1)', section: 'partH' },
    { ref: 'H.5', text: 'Solid waste storage provided with adequate capacity and access for collection (H6)', section: 'partH' },
  ],
};

const partJ: TemplateSection = {
  title: 'Part J — Combustion Appliances and Fuel Storage',
  key: 'partJ',
  items: [
    { ref: 'J.1', text: 'Heating system type, location, installation and any combustion air/flue details confirmed (J1–J3)', section: 'partJ' },
    { ref: 'J.2', text: 'Flue discharge position compliant — adequate clearance from openings, boundaries, and combustible materials (J1)', section: 'partJ' },
    { ref: 'J.3', text: 'Carbon monoxide alarms provided where required (J2A)', section: 'partJ' },
    { ref: 'J.4', text: 'Fuel storage (if applicable) — location, containment, fire separation and access confirmed (J6/J7)', section: 'partJ' },
  ],
};

const partK: TemplateSection = {
  title: 'Part K — Protection from Falling, Collision and Impact',
  key: 'partK',
  items: [
    { ref: 'K.1', text: 'New staircases — rise/goings, head heights, handrails both sides, guarding 900mm above pitch line / 1100mm on landings (K1)', section: 'partK' },
    { ref: 'K.2', text: 'Terrace and balcony guarding — minimum 1100mm height, non-climbable (K2)', section: 'partK' },
    { ref: 'K.3', text: 'Safety glazing per BS EN 12600 / BS 6206 — under 800mm, 1500mm for doors, 300mm zone around doors (K4)', section: 'partK' },
    { ref: 'K.4', text: 'Door vision panels at 500–800mm and 1150–1500mm per AD K Diagram 10.1 (K6)', section: 'partK' },
    { ref: 'K.5', text: 'Doors swinging across access routes — guarding and cane detection per AD K Diagram 10.2 (K6)', section: 'partK' },
    { ref: 'K.6', text: 'Manifestation on glazed screens and doors at 850–1000mm and 1400–1600mm per AD K Diagram 7.1 (K5)', section: 'partK' },
    { ref: 'K.7', text: 'Ramps — maximum gradient, width, landings, handrails and surface finish comply (K1)', section: 'partK' },
    { ref: 'K.8', text: 'Loading bays — adequate guarding and vehicle barriers where applicable (K3)', section: 'partK' },
  ],
};

const partL: TemplateSection = {
  title: 'Part L — Conservation of Fuel and Power',
  key: 'partL',
  items: [
    { ref: 'L.1', text: 'Consequential improvements identified and implemented where applicable (>25% envelope or >50% single element)', section: 'partL' },
    { ref: 'L.2', text: 'New fixed building services and fittings meet AD L minimum standards', section: 'partL' },
    { ref: 'L.3', text: 'Commissioning plan for building services in place', section: 'partL' },
    { ref: 'L.4', text: 'U-values of new/replaced thermal elements meet or exceed AD L Table 4.2', section: 'partL' },
    { ref: 'L.5', text: 'Air permeability meets target — pressure testing arranged', section: 'partL' },
    { ref: 'L.6', text: 'Pipework and ductwork insulation installed to minimise heat loss', section: 'partL' },
    { ref: 'L.7', text: 'Lighting efficacy meets minimum requirements for the building type', section: 'partL' },
    { ref: 'L.8', text: 'Building services energy metering provided where required', section: 'partL' },
    { ref: 'L.9', text: 'Building log book prepared with as-installed information for building services', section: 'partL' },
  ],
};

const partM: TemplateSection = {
  title: 'Part M — Access to and Use of Buildings',
  key: 'partM',
  items: [
    { ref: 'M.1', text: 'Accessible WC facilities per AD M Vol 2 Diagrams 18/19 (M1)', section: 'partM' },
    { ref: 'M.2', text: 'Level access / ramp provision at principal entrance maintained (M1)', section: 'partM' },
    { ref: 'M.3', text: 'Colour contrast provided to doors, ironmongery, sanitary fittings, stair nosings (M1)', section: 'partM' },
    { ref: 'M.4', text: 'Reception areas accessible — low-level counter sections, hearing loops where applicable (M1)', section: 'partM' },
    { ref: 'M.5', text: 'Corridors and circulation routes adequate width for wheelchair access (M1)', section: 'partM' },
    { ref: 'M.6', text: 'Lift provision — accessible controls, door widths, car dimensions per AD M (M1)', section: 'partM' },
    { ref: 'M.7', text: 'Signage — accessible wayfinding including tactile signs where required (M1)', section: 'partM' },
  ],
};

const partO: TemplateSection = {
  title: 'Part O — Overheating',
  key: 'partO',
  items: [
    { ref: 'O.1', text: 'Overheating risk assessment completed (residential buildings / mixed-use with residential)', section: 'partO' },
    { ref: 'O.2', text: 'Glazing areas, orientation and shading strategy reviewed against overheating criteria', section: 'partO' },
    { ref: 'O.3', text: 'Adequate means of removing excess heat provided (purge ventilation, cross-ventilation, mechanical cooling)', section: 'partO' },
  ],
};

const partP: TemplateSection = {
  title: 'Part P — Electrical Safety',
  key: 'partP',
  items: [
    { ref: 'P.1', text: 'Electrical installation designed, installed, inspected and tested per BS 7671:2018+A2:2022', section: 'partP' },
    { ref: 'P.2', text: 'Electrical Installation Certificate (EIC) provided by competent person', section: 'partP' },
    { ref: 'P.3', text: 'RCD protection provided to final circuits as required', section: 'partP' },
    { ref: 'P.4', text: 'Consumer unit / distribution boards located in accessible positions', section: 'partP' },
  ],
};

const partQ: TemplateSection = {
  title: 'Part Q — Security (Dwellings Only)',
  key: 'partQ',
  items: [
    { ref: 'Q.1', text: 'Doors and windows meet security requirements of AD Q (if applicable — dwellings/residential only)', section: 'partQ' },
    { ref: 'Q.2', text: 'Door locks, letter plates and glazing meet PAS 24 or equivalent standards', section: 'partQ' },
  ],
};

const partR: TemplateSection = {
  title: 'Part R — High-Speed Electronic Communications',
  key: 'partR',
  items: [
    { ref: 'R.1', text: 'In-building physical infrastructure capable of supporting gigabit-capable connections provided (R1)', section: 'partR' },
    { ref: 'R.2', text: 'Connection point accessible within the building (R1)', section: 'partR' },
    { ref: 'R.3', text: 'Duct/cable routes from building connection point to network termination points adequate', section: 'partR' },
  ],
};

const partS: TemplateSection = {
  title: 'Part S — Infrastructure for Charging Electric Vehicles',
  key: 'partS',
  items: [
    { ref: 'S.1', text: 'Electric vehicle charge points provided where required — minimum provision met (S1)', section: 'partS' },
    { ref: 'S.2', text: 'Cable routes for future charge point installation provided where full installation not yet required (S2)', section: 'partS' },
    { ref: 'S.3', text: 'Charge points accessible and in safe locations', section: 'partS' },
  ],
};

const partT: TemplateSection = {
  title: 'Part T — Telecommunications Infrastructure (Wales Only)',
  key: 'partT',
  items: [
    { ref: 'T.1', text: 'Confirm whether Part T applies to this project (Wales jurisdiction only)', section: 'partT' },
    { ref: 'T.2', text: 'If applicable — telecommunications infrastructure provided per AD T requirements', section: 'partT' },
  ],
};

const commissioning: TemplateItem[] = [
  { ref: 'COM.1', text: 'Fire alarm commissioning certificate — BS 5839-1:2017', section: 'commissioning' },
  { ref: 'COM.2', text: 'Emergency lighting commissioning certificate — BS 5266-1:2016', section: 'commissioning' },
  { ref: 'COM.3', text: 'Electrical Installation Certificate (EIC) — BS 7671:2018+A2:2022', section: 'commissioning' },
  { ref: 'COM.4', text: 'HVAC commissioning certificate — air tightness and flow rates', section: 'commissioning' },
  { ref: 'COM.5', text: 'Lift commissioning certificate', section: 'commissioning' },
  { ref: 'COM.6', text: 'Fire stopping specialist warranty / tag log', section: 'commissioning' },
  { ref: 'COM.7', text: 'Fire/smoke curtain commissioning certificate (if applicable)', section: 'commissioning' },
  { ref: 'COM.8', text: 'Gas safety certificate (if applicable)', section: 'commissioning' },
  { ref: 'COM.9', text: 'Pressure testing / air permeability certificate', section: 'commissioning' },
  { ref: 'COM.10', text: 'Sound testing certificate (if applicable)', section: 'commissioning' },
  { ref: 'COM.11', text: 'Water systems commissioning (legionella risk assessment and flushing certificate)', section: 'commissioning' },
  { ref: 'COM.12', text: 'Lightning protection certificate (if applicable)', section: 'commissioning' },
];

const statutoryDeclarations: TemplateItem[] = [
  { ref: 'DEC.1', text: 'Declaration 1 — Notification of Duty Holders returned before commencement', section: 'declarations' },
  { ref: 'DEC.2', text: 'Declaration 2 — Commencement returned within 5 working days of legal commencement', section: 'declarations' },
  { ref: 'DEC.3', text: 'Declaration 3 — Compliance Completion returned (required before Final Certificate)', section: 'declarations' },
];

const generalObservations: TemplateItem[] = [
  { ref: 'GEN.1', text: 'Site welfare and housekeeping acceptable', section: 'general' },
  { ref: 'GEN.2', text: 'Works proceeding in accordance with approved drawings', section: 'general' },
  { ref: 'GEN.3', text: 'No unauthorised deviations from approved design observed', section: 'general' },
  { ref: 'GEN.4', text: 'Builder\'s work openings adequately protected during construction', section: 'general' },
  { ref: 'GEN.5', text: 'Temporary fire strategy / evacuation plan in place during works', section: 'general' },
  { ref: 'GEN.6', text: 'CDM compliance — construction phase plan available, principal contractor duties being discharged', section: 'general' },
  { ref: 'GEN.7', text: 'Asbestos management — refurbishment/demolition survey available, works in accordance with survey findings', section: 'general' },
  { ref: 'GEN.8', text: 'Waste management — materials segregated, duty of care waste transfer notes available', section: 'general' },
];

export const allSections: TemplateSection[] = [
  reg7,
  partA,
  partB1,
  partB2,
  partB3,
  partB4,
  partB5,
  reg38,
  partC,
  partD,
  partE,
  partF,
  partG,
  partH,
  partJ,
  partK,
  partL,
  partM,
  partO,
  partP,
  partQ,
  partR,
  partS,
  partT,
];

export const defaultTemplate: ProjectConfig = {
  metadata: {
    name: '',
    address: '',
    reference: '',
    description: 'Category A Refurbishment',
    bcBody: '',
    bcContact: '',
    company: 'Isles Safety Ltd',
    inspector: '',
  },
  sections: allSections,
  commissioningItems: commissioning,
  statutoryDeclarations,
  generalObservations,
};

export function createProjectConfigFromTemplate(
  metadata: Partial<ProjectMetadata>
): ProjectConfig {
  return {
    ...defaultTemplate,
    metadata: { ...defaultTemplate.metadata, ...metadata },
  };
}
