using System.Linq;
using System.Text.Json;
using Roundtable.Domain.Entities;

namespace Roundtable.Infrastructure.Seed;

public static class MeetingTopicsSeed
{
    private sealed class TopicTemplate
    {
        public string Title { get; set; } = "";
        public string Notes { get; set; } = "";
        public string? Tags { get; set; }
        public string? ReferenceDocumentsJson { get; set; }
        public int OrgIndex { get; set; }
    }

    /// <summary>Long-form notes (meeting-committee voice) themed around celebrated films from the IMDb Top 250 / “top 100” canon.</summary>
    private static readonly string[] MovieNotes =
    {
        // The Shawshank Redemption
        """
        Treat this workstream like a long sentence you are determined to finish with receipts: hope is not a milestone, but tunneling is. We need a single owner for the library of assumptions, a second pair of eyes on the laundry list of dependencies, and a credible timeline that survives parole-board scrutiny from finance. If someone offers “institutional wisdom,” translate it into testable tasks. Exit criteria: named approvers, a clean handoff memo, and zero mystery bags of cash in the risk register—metaphorically speaking.
        """.Trim(),
        // The Godfather
        """
        This is a family business conversation dressed as governance: alliances matter, but minutes matter more. Map who owes loyalty to which workstream, which “offers” are actually commitments, and where the cannoli of scope creep might arrive late. We will not negotiate with unnamed stakeholders; every signature route is documented. Close with one chair, one timeline, and a clear line between legitimate operations and side quests that belong in a spin-off project.
        """.Trim(),
        // The Dark Knight
        """
        Chaos is not a methodology—so we pin decisions to evidence. Designate a single escalation path for “Joker-grade” surprises: budget, security, comms. Dual-track planning is fine; dual-track truth is not—pick one source of status. If a stakeholder insists on heroics, ask for staffing and a rollback. We finish with a Gotham-grade contingency: lights on, bridges mapped, and nobody pretending the clown mask is a strategy.
        """.Trim(),
        // Pulp Fiction
        """
        Non-linear narratives belong in the brief, not in the RAID log. Sequence the work: briefcase items are deliverables, not mysteries. Establish house rules for retroactive scope (“we need to go back to the apartment”) and timebox debate. If two storylines contradict, reconcile with data, not monologues. Deliverable: a watchable timeline—no accidental adrenaline shots in procurement.
        """.Trim(),
        // Schindler’s List / historical drama weight
        """
        Some agendas carry moral weight beyond throughput: document decisions with care, name reviewers who understand sensitivity review, and separate memorialization tasks from optimization chatter. Logistics must be precise; tone must be respectful. We track approvals like names on a list—nothing omitted, nothing ornamental. The goal is accountability you can audit years later without flinching.
        """.Trim(),
        // 12 Angry Men
        """
        Assume reasonable doubt until evidence is posted. Rotate dissent: give the quiet room a voice, challenge the loudest default, and require a written rationale for “guilty of delay” verdicts. One fact at a time; one owner per fact. If temperature rises, cool the room with criteria, not anecdotes. Adjourn only when the jury of peers agrees what “beyond reasonable scope” means for us.
        """.Trim(),
        // Inception
        """
        Dreams within dreams are just nested dependencies—name the kick, the totem, and the reality checkpoint. If someone proposes a four-layer plan, demand synchronization: who wakes first when the budget alarm rings? Shared dreaming is not a substitute for shared documentation. We exit with a single top-level objective and a limbo clause for research spikes that refuse to end.
        """.Trim(),
        // The Matrix
        """
        Choose the red pill: accept constraints as they are measured, not as they are wished. Assign operators versus agents: builders vs. blockers. Spoons do not bend budgets; people negotiate trade-offs. Establish a “Nebuchadnezzar” comms channel for truth—no simulated green screens in status. Final state: freedom from illusionary green metrics.
        """.Trim(),
        // Fight Club
        """
        First rule: we actually talk about blockers in the first five minutes. Second rule: no duplicate shadow projects with cooler names. Third rule: pain is not a plan—convert adrenaline into tests. If someone wants to blow up debt, do it in a controlled demolition with backups. Close with identity clarity: who owns what, and which name signs the charter.
        """.Trim(),
        // Forrest Gump
        """
        Life may be a box of chocolates, but procurement is not: label allergens, costs, and shelf life. Simple beats clever when timelines wobble—pick a straight path, then iterate. Running across the country is not a milestone; rest stops are. Celebrate small wins without narrating forever. Deliverable: a plan a benchmate could follow without the accent, but with the same discipline.
        """.Trim(),
        // One Flew Over the Cuckoo’s Nest
        """
        Challenge the schedule machine when it hums nonsense: ask who benefits from the current cadence versus who is medicated with meetings. Empower a credible counterweight to passive drift—without theatrics that derail the ward. Document exceptions like treatment plans: who approved, for how long, and when review happens. End with autonomy where safe, structure where not.
        """.Trim(),
        // Goodfellas
        """
        Keep the operation boring on paper: cashflow transparent, roles explicit, and “favors” translated into contracts. If someone says “Paulie said it’s fine,” ask for Paulie in the RACI. Fast may be fun; auditable is how you stay out of the retrospective jail. Wrap with a single trunk of priorities—no side hustle backlog hidden in the basement freezer.
        """.Trim(),
        // The Lord of the Rings
        """
        Long journeys fail on provisioning, not dragons. Name the fellowship: who carries scope, who carries risk, who carries comms. Mordor is not a sprint; phase gates are not optional rest stops. If the ring is “must-launch,” define corrupting side effects early. Epilogue: even hobbits pay tech debt—schedule the Shire cleanup sprint.
        """.Trim(),
        // Star Wars (original trilogy energy)
        """
        Hope is a tactic only with telemetry. Train the team before the trench run: simulations, checklists, and explicit “use the scope” moments. Identify Darth-level dependencies early; they rarely turn good in Act Three. If someone says “I am your sponsor,” verify charter lineage. Finish with medals for maintainers, not just pilots.
        """.Trim(),
        // Casablanca
        """
        We’ll always have Paris—meaning we’ll always have the original requirements in an appendix. Prioritize the letters of transit: approvals that unlock work. If plans require sacrifice, make it explicit who stays at the airport and why. No piano-driven scope changes without a ticket. Close with a human outcome: shipped, documented, and kind to the team left on the tarmac of v2.
        """.Trim(),
        // Rear Window
        """
        Observation without action is voyeurism: turn signals into tickets. Binoculars spot risks; owners close them. If neighbors look suspicious, it’s probably cross-team dependency—verify before the police escalation. Privacy matters: redact personal data in incident notes. Resolution: a quiet street where every window has an owner watching their own pane.
        """.Trim(),
        // Spirited Away
        """
        When the tunnel looks tasty, read the contract anyway. Parents-turned-pigs are technical debt: feed carefully, unwind deliberately. Name spirits honestly—guests vs. staff vs. vendors. If the bathhouse gets busy, throttle intake; quality beats infinite throughput. Epilogue: remember your real name in the backlog so you can leave the sprint world when the train arrives.
        """.Trim(),
        // Parasite
        """
        Basements hide surprises—map elevation: who is upstream, who floods first. Class gradients show up as access; design gates accordingly. If someone smuggles scope in a peach box, inspect it. Finish with ventilation: transparent airflow between teams, no sealed rooms of “temporary” work. Moral: uplift without exploitation, delivery without infestation.
        """.Trim(),
    };

    private static readonly string[] MovieTitles =
    {
        "Shawshank debrief: hope as a delivery strategy",
        "Godfather session: offers we can’t refuse vs. signed charters",
        "Dark Knight stand-up: chaos budgets and escalation bats",
        "Pulp Fiction timeline: non-linear stories, linear RAID",
        "Schindler list review: sensitive workstream documentation",
        "12 Angry Stakeholders: evidence before verdict",
        "Inception planning: kicks, totems, nested dependencies",
        "Matrix retro: red-pill metrics vs. simulation green",
        "Fight Club governance: rules, owners, controlled demolition",
        "Forrest roadmap: chocolate-box risk labels",
        "Cuckoo’s Nest cadence: who owns the schedule machine",
        "Goodfellas ops: boring-on-paper cashflow",
        "LOTR program office: fellowship RACI and Mordor phasing",
        "Star Wars rehearsal: trench-run checklists",
        "Casablanca scope: letters of transit (approvals) first",
        "Rear Window triage: binocular risks to tickets",
        "Spirited sprint bathhouse: contracts and throttled WIP",
        "Parasite architecture: basement debt and ventilation",
        "Indiana Jones intake: trap detection in requirements",
        "Titanic float plan: compartments, lifeboats, icebergs in risk log",
        "Blade Runner origami notes: which memories are canonical",
        "Gladiator arena QBR: are you not entertained by burndown?",
        "Whiplash tempo: tempo without bleeding eardrums",
        "Silence lambs backlog: clarify the moths in the backlog",
    };

    private static readonly int[] OrgCycle =
    {
        0, 4, 8, 2, 6, 9, 1, 5, 3, 7, 0, 5, 2, 8, 4, 6,
    };

    /// <summary>0–3 tags each (comma-separated). Null = no tags.</summary>
    private static readonly string?[] TagCycle =
    {
        null,
        "DRAMA",
        "CRIME, THRILLER",
        "EPIC, WAR, CLASSIC",
        "SCI-FI",
        "NOIR",
        "COMEDY, ROMANCE",
        "ANIMATION, FAMILY",
        "THRILLER, SUSPENSE",
        "BIOPIC",
        "ACTION, SPY",
        "FANTASY, ADVENTURE",
        "WESTERN",
        "HORROR, PSYCHOLOGICAL",
        "MUSICAL",
        "SUPERHERO, BLOCKBUSTER",
        "DRAMA, COURTROOM",
        "HEIST, ENSEMBLE",
        "ROMANCE, PERIOD",
        "SCI-FI, CYBERPUNK",
        "WAR, ANTI-WAR",
        "MYSTERY, TWIST",
        "ART-HOUSE, SUBTITLED",
        "SATIRE, COMEDY",
        "FILM-NOIR, REMAKE",
    };

    /// <summary>C# % can be negative; array indices must be in [0, length).</summary>
    private static int PositiveMod(int dividend, int divisor)
    {
        if (divisor <= 0)
            throw new ArgumentOutOfRangeException(nameof(divisor));
        int r = dividend % divisor;
        return r < 0 ? r + divisor : r;
    }

    private static List<TopicTemplate> BuildTeamTemplates(string teamId)
    {
        // Bound hash so i+h / i+h*5 never overflow int (which would make % negative and indexes invalid).
        var h = (int)(unchecked((uint)StringComparer.Ordinal.GetHashCode(teamId)) % 10007);
        var list = new List<TopicTemplate>(16);
        for (int i = 0; i < 16; i++)
        {
            int noteIdx = PositiveMod(h + i * 7, MovieNotes.Length);
            int titleIdx = PositiveMod(h + i * 17 + i * i, MovieTitles.Length);
            int orgCycleIdx = PositiveMod(i + h, OrgCycle.Length);
            int orgIdx = PositiveMod(OrgCycle[orgCycleIdx], OrganisationsSeed.Data.Length);
            var tagStr = TagCycle[PositiveMod(i + h * 5, TagCycle.Length)];
            list.Add(new TopicTemplate
            {
                Title = MovieTitles[titleIdx],
                Notes = MovieNotes[noteIdx],
                Tags = string.IsNullOrWhiteSpace(tagStr) ? null : tagStr.Trim(),
                OrgIndex = orgIdx,
            });
        }

        return list;
    }

    private static readonly Dictionary<string, List<TopicTemplate>> TemplatesByTeam =
        TeamsSeed.Data.ToDictionary(t => t.Id, t => BuildTeamTemplates(t.Id), StringComparer.Ordinal);

    public static List<MeetingTopic> Generate(
        IReadOnlyList<(int MeetingId, string TeamId)> meetings,
        IReadOnlyList<int> organisationIds,
        IReadOnlyList<string> organisationNames,
        int maxExistingDisplayNumber)
    {
        if (organisationIds.Count == 0)
            return new List<MeetingTopic>();

        var topics = new List<MeetingTopic>();
        int topicOrdinal = 0;
        int displayNumber = maxExistingDisplayNumber;
        foreach (var (meetingId, teamId) in meetings)
        {
            if (!TemplatesByTeam.TryGetValue(teamId, out var templates) || templates.Count == 0)
                continue;

            int count = Math.Min(templates.Count, 2 + (meetingId % 6));
            if (count < 2)
                count = 2;

            var used = new HashSet<int>();
            for (int i = 0; i < count; i++)
            {
                int idx = (meetingId + i * 17) % templates.Count;
                while (used.Contains(idx))
                    idx = (idx + 1) % templates.Count;
                used.Add(idx);

                var t = templates[idx];
                int? orgId = t.OrgIndex < organisationIds.Count ? organisationIds[t.OrgIndex] : organisationIds[0];
                var orgName = t.OrgIndex < organisationNames.Count
                    ? organisationNames[t.OrgIndex]
                    : (organisationNames.Count > 0 ? organisationNames[0] : null);
                var refIds = GenerateReferenceIds(meetingId, topicOrdinal);
                displayNumber++;
                topics.Add(new MeetingTopic
                {
                    DisplayNumber = displayNumber,
                    MeetingId = meetingId,
                    Title = t.Title,
                    Notes = t.Notes,
                    Tags = t.Tags,
                    ReferenceDocumentsJson = refIds.Count > 0 ? JsonSerializer.Serialize(refIds) : null,
                    OrganisationId = orgId,
                    CreatedByUserGuid = ResolveSeedCreatorUserGuid(orgName, meetingId, topicOrdinal),
                    CreatedByOrganisation = orgName,
                });
                topicOrdinal++;
            }
        }

        EnsureOrganisationDiversity(topics, organisationIds, organisationNames);
        return topics;
    }

    /// <summary>
    /// Maps seed organisation to a real <see cref="User.Guid"/> so API can resolve <c>CreatedByNickname</c>.
    /// First organisation topics use Ewout on a rotating basis; other orgs prefer a user with matching <see cref="User.Organisation"/>.
    /// </summary>
    private static string ResolveSeedCreatorUserGuid(string? orgName, int meetingId, int salt)
    {
        var firstOrg = OrganisationsSeed.Data[0].Name;
        if (!string.IsNullOrEmpty(orgName) &&
            string.Equals(orgName, firstOrg, StringComparison.OrdinalIgnoreCase))
        {
            return (meetingId + salt) % 3 == 0 ? UsersSeed.EwoutUserGuid : UsersSeed.NintendoAltUserGuid;
        }

        var byOrg = UsersSeed.Data.FirstOrDefault(u =>
            !string.IsNullOrEmpty(u.Organisation) &&
            string.Equals(u.Organisation, orgName, StringComparison.OrdinalIgnoreCase));
        if (byOrg != null)
            return byOrg.Guid;

        return PickFallbackCreatorUserGuid(meetingId, salt, excludeEwout: true);
    }

    private static string PickFallbackCreatorUserGuid(int meetingId, int salt, bool excludeEwout)
    {
        var pool = UsersSeed.Data
            .Where(u => !string.IsNullOrWhiteSpace(u.DisplayName))
            .Where(u => !excludeEwout || u.Guid != UsersSeed.EwoutUserGuid)
            .ToList();
        if (pool.Count == 0)
            return UsersSeed.EwoutUserGuid;
        var idx = Math.Abs((meetingId * 31 + salt) % pool.Count);
        return pool[idx].Guid;
    }

    /// <summary>Ensures each meeting has at least one topic from organisation #1 (index 0) and one from a different organisation.</summary>
    private static void EnsureOrganisationDiversity(
        List<MeetingTopic> topics,
        IReadOnlyList<int> organisationIds,
        IReadOnlyList<string> organisationNames)
    {
        if (organisationNames.Count == 0 || organisationIds.Count == 0)
            return;

        var firstName = organisationNames[0];
        var firstId = organisationIds[0];

        var otherIdx = -1;
        for (var i = 1; i < organisationNames.Count; i++)
        {
            if (!string.Equals(organisationNames[i], firstName, StringComparison.OrdinalIgnoreCase))
            {
                otherIdx = i;
                break;
            }
        }

        foreach (var group in topics.GroupBy(t => t.MeetingId))
        {
            var meetingId = group.Key;
            var list = group.OrderBy(t => t.DisplayNumber).ToList();
            if (list.Count == 0)
                continue;

            var hasFirst = list.Any(t =>
                string.Equals(t.CreatedByOrganisation, firstName, StringComparison.OrdinalIgnoreCase));
            var slotFirst = PickDiversitySlot(meetingId, list.Count, salt: 17);
            if (!hasFirst)
                AssignSeedOrg(list[slotFirst], firstId, firstName);

            if (otherIdx < 0)
                continue;

            var hasOther = group.Any(t =>
                !string.Equals(t.CreatedByOrganisation, firstName, StringComparison.OrdinalIgnoreCase));
            if (!hasOther && list.Count > 1)
            {
                var otherName = organisationNames[otherIdx];
                var otherId = organisationIds[otherIdx];
                var slotOther = PickDiversitySlot(meetingId, list.Count, salt: 31);
                var guard = 0;
                while (slotOther == slotFirst && guard++ < list.Count)
                    slotOther = (slotOther + 1) % list.Count;

                AssignSeedOrg(list[slotOther], otherId, otherName);
            }
        }
    }

    private static int PickDiversitySlot(int meetingId, int listCount, int salt)
    {
        if (listCount <= 1)
            return 0;
        return Math.Abs(meetingId * salt + listCount * 3) % listCount;
    }

    private static void AssignSeedOrg(MeetingTopic t, int orgId, string orgName)
    {
        t.OrganisationId = orgId;
        t.CreatedByOrganisation = orgName;
        t.CreatedByUserGuid = ResolveSeedCreatorUserGuid(orgName, t.MeetingId, t.DisplayNumber);
    }

    /// <summary>Generates 0-3 reference IDs per topic: each is a 5-10 character hex string. Deterministic from meetingId and topicOrdinal.</summary>
    private static List<string> GenerateReferenceIds(int meetingId, int topicOrdinal)
    {
        const string Hex = "0123456789abcdef";
        int seed = unchecked(meetingId * 31 + topicOrdinal);
        var rng = new Random(seed);
        int count = rng.Next(0, 4);
        var list = new List<string>(count);
        for (int i = 0; i < count; i++)
        {
            int len = rng.Next(5, 11);
            var chars = new char[len];
            for (int j = 0; j < len; j++)
                chars[j] = Hex[rng.Next(Hex.Length)];
            list.Add(new string(chars));
        }
        return list;
    }
}
