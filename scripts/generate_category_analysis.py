#!/usr/bin/env python3
"""
Generate visualizations showing technique category imbalances in the TEA Techniques dataset.
This script analyzes the distribution of techniques across different assurance goals and
creates compelling data visualizations for the academic paper.
"""

import json
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter
import numpy as np
from pathlib import Path

# Set style for academic paper
plt.style.use("seaborn-v0_8-whitegrid")
sns.set_palette("husl")


def load_techniques_data():
    """Load the techniques data from JSON file."""
    data_path = Path(__file__).parent.parent / "public" / "data" / "techniques.json"
    with open(data_path, "r") as f:
        return json.load(f)


def analyze_assurance_goals(techniques):
    """Analyze distribution of techniques across assurance goals."""
    goal_counts = Counter()
    goal_combinations = Counter()

    for technique in techniques:
        goals = technique.get("assurance_goals", [])

        # Count individual goals
        for goal in goals:
            goal_counts[goal] += 1

        # Count goal combinations
        if len(goals) > 1:
            goal_combo = tuple(sorted(goals))
            goal_combinations[goal_combo] += 1

    return goal_counts, goal_combinations


def analyze_technique_types(techniques):
    """Analyze distribution of technique types."""
    type_counts = Counter()

    for technique in techniques:
        tags = technique.get("tags", [])
        for tag in tags:
            if tag.startswith("technique-type/"):
                technique_type = tag.split("/")[-1].replace("-", " ").title()
                type_counts[technique_type] += 1

    return type_counts


def analyze_lifecycle_stages(techniques):
    """Analyze distribution across lifecycle stages."""
    stage_counts = Counter()

    for technique in techniques:
        tags = technique.get("tags", [])
        for tag in tags:
            if tag.startswith("lifecycle-stage/"):
                stage = tag.split("/")[-1].replace("-", " ").title()
                stage_counts[stage] += 1

    return stage_counts


def create_assurance_goals_visualization(goal_counts, output_dir):
    """Create bar chart showing technique distribution by assurance goal."""
    plt.figure(figsize=(12, 8))

    # Sort goals by count in descending order
    sorted_goals = sorted(goal_counts.items(), key=lambda x: x[1], reverse=True)
    goals = [item[0] for item in sorted_goals]
    counts = [item[1] for item in sorted_goals]

    # Create bar chart with custom colors
    colors = plt.cm.Set3(np.linspace(0, 1, len(goals)))
    bars = plt.bar(goals, counts, color=colors, edgecolor="black", linewidth=0.5)

    # Add value labels on bars
    for bar, count in zip(bars, counts):
        plt.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.5,
            str(count),
            ha="center",
            va="bottom",
            fontweight="bold",
        )

    plt.title(
        "Distribution of TEA Techniques by Assurance Goal",
        fontsize=16,
        fontweight="bold",
        pad=20,
    )
    plt.xlabel("Assurance Goal", fontsize=12, fontweight="bold")
    plt.ylabel("Number of Techniques", fontsize=12, fontweight="bold")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()

    # Save figure
    output_path = output_dir / "assurance_goals_distribution.png"
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()

    return output_path


def create_goal_combinations_visualization(goal_combinations, output_dir):
    """Create visualization showing common goal combinations."""
    plt.figure(figsize=(14, 8))

    # Get top 10 combinations
    top_combinations = goal_combinations.most_common(10)
    combo_labels = [" + ".join(combo) for combo, _ in top_combinations]
    combo_counts = [count for _, count in top_combinations]

    # Create horizontal bar chart
    bars = plt.barh(
        range(len(combo_labels)),
        combo_counts,
        color=plt.cm.viridis(np.linspace(0, 1, len(combo_labels))),
    )

    # Add value labels
    for i, (bar, count) in enumerate(zip(bars, combo_counts)):
        plt.text(
            bar.get_width() + 0.1,
            bar.get_y() + bar.get_height() / 2,
            str(count),
            ha="left",
            va="center",
            fontweight="bold",
        )

    plt.yticks(range(len(combo_labels)), combo_labels)
    plt.title(
        "Most Common Assurance Goal Combinations in TEA Techniques",
        fontsize=16,
        fontweight="bold",
        pad=20,
    )
    plt.xlabel("Number of Techniques", fontsize=12, fontweight="bold")
    plt.gca().invert_yaxis()
    plt.tight_layout()

    # Save figure
    output_path = output_dir / "goal_combinations_distribution.png"
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()

    return output_path


def create_comprehensive_overview(techniques, output_dir):
    """Create a comprehensive overview with multiple subplots."""
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))

    # 1. Assurance Goals Distribution
    goal_counts, _ = analyze_assurance_goals(techniques)
    goals = list(goal_counts.keys())
    counts = list(goal_counts.values())

    colors = plt.cm.Set3(np.linspace(0, 1, len(goals)))
    bars1 = ax1.bar(goals, counts, color=colors, edgecolor="black", linewidth=0.5)
    ax1.set_title("Techniques by Assurance Goal", fontweight="bold")
    ax1.set_xlabel("Assurance Goal")
    ax1.set_ylabel("Number of Techniques")
    ax1.tick_params(axis="x", rotation=45)

    # Add value labels
    for bar, count in zip(bars1, counts):
        ax1.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.5,
            str(count),
            ha="center",
            va="bottom",
            fontweight="bold",
            fontsize=9,
        )

    # 2. Technique Types Distribution
    type_counts = analyze_technique_types(techniques)
    types = list(type_counts.keys())
    type_values = list(type_counts.values())

    ax2.pie(type_values, labels=types, autopct="%1.1f%%", startangle=90)
    ax2.set_title("Techniques by Type", fontweight="bold")

    # 3. Lifecycle Stages Distribution
    stage_counts = analyze_lifecycle_stages(techniques)
    stages = list(stage_counts.keys())
    stage_values = list(stage_counts.values())

    bars3 = ax3.barh(
        stages, stage_values, color=plt.cm.viridis(np.linspace(0, 1, len(stages)))
    )
    ax3.set_title("Techniques by Lifecycle Stage", fontweight="bold")
    ax3.set_xlabel("Number of Techniques")

    # Add value labels
    for bar, count in zip(bars3, stage_values):
        ax3.text(
            bar.get_width() + 0.1,
            bar.get_y() + bar.get_height() / 2,
            str(count),
            ha="left",
            va="center",
            fontweight="bold",
            fontsize=9,
        )

    # 4. Goal Imbalance Analysis
    goal_percentages = [(count / sum(counts)) * 100 for count in counts]
    ax4.bar(goals, goal_percentages, color=colors, edgecolor="black", linewidth=0.5)
    ax4.set_title("Assurance Goal Imbalance (%)", fontweight="bold")
    ax4.set_xlabel("Assurance Goal")
    ax4.set_ylabel("Percentage of Total Techniques")
    ax4.tick_params(axis="x", rotation=45)

    # Add percentage labels
    for i, (goal, pct) in enumerate(zip(goals, goal_percentages)):
        ax4.text(
            i,
            pct + 0.5,
            f"{pct:.1f}%",
            ha="center",
            va="bottom",
            fontweight="bold",
            fontsize=9,
        )

    plt.suptitle(
        "TEA Techniques Dataset: Comprehensive Category Analysis",
        fontsize=18,
        fontweight="bold",
        y=0.98,
    )
    plt.tight_layout()

    # Save figure
    output_path = output_dir / "comprehensive_category_analysis.png"
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()

    return output_path


def generate_summary_statistics(techniques):
    """Generate summary statistics for the analysis."""
    goal_counts, goal_combinations = analyze_assurance_goals(techniques)
    type_counts = analyze_technique_types(techniques)
    stage_counts = analyze_lifecycle_stages(techniques)

    total_techniques = len(techniques)

    # Calculate imbalance metrics
    goal_values = list(goal_counts.values())
    max_goal_count = max(goal_values)
    min_goal_count = min(goal_values)
    imbalance_ratio = max_goal_count / min_goal_count

    # Most and least represented goals
    most_represented = max(goal_counts, key=goal_counts.get)
    least_represented = min(goal_counts, key=goal_counts.get)

    stats = {
        "total_techniques": total_techniques,
        "assurance_goals": dict(goal_counts),
        "technique_types": dict(type_counts),
        "lifecycle_stages": dict(stage_counts),
        "imbalance_ratio": imbalance_ratio,
        "most_represented_goal": (most_represented, goal_counts[most_represented]),
        "least_represented_goal": (least_represented, goal_counts[least_represented]),
        "top_goal_combinations": goal_combinations.most_common(5),
    }

    return stats


def main():
    """Main function to generate all visualizations and analysis."""
    # Create output directory
    output_dir = Path(__file__).parent.parent / "article" / "figures"
    output_dir.mkdir(exist_ok=True)

    # Load data
    print("Loading TEA Techniques data...")
    techniques = load_techniques_data()

    # Generate visualizations
    print("Generating assurance goals visualization...")
    goal_counts, goal_combinations = analyze_assurance_goals(techniques)
    goals_viz = create_assurance_goals_visualization(goal_counts, output_dir)

    print("Generating goal combinations visualization...")
    combinations_viz = create_goal_combinations_visualization(
        goal_combinations, output_dir
    )

    print("Generating comprehensive overview...")
    overview_viz = create_comprehensive_overview(techniques, output_dir)

    # Generate statistics
    print("Generating summary statistics...")
    stats = generate_summary_statistics(techniques)

    # Save statistics to JSON
    stats_path = output_dir / "category_analysis_stats.json"
    with open(stats_path, "w") as f:
        json.dump(stats, f, indent=2)

    # Print summary
    print("\n=== TEA Techniques Category Analysis Summary ===")
    print(f"Total techniques analyzed: {stats['total_techniques']}")
    print("Assurance goals distribution:")
    for goal, count in sorted(
        stats["assurance_goals"].items(), key=lambda x: x[1], reverse=True
    ):
        percentage = (count / stats["total_techniques"]) * 100
        print(f"  {goal}: {count} techniques ({percentage:.1f}%)")

    print(f"\nImbalance ratio (max/min): {stats['imbalance_ratio']:.2f}")
    print(
        f"Most represented: {stats['most_represented_goal'][0]} ({stats['most_represented_goal'][1]} techniques)"
    )
    print(
        f"Least represented: {stats['least_represented_goal'][0]} ({stats['least_represented_goal'][1]} techniques)"
    )

    print("\nGenerated visualizations:")
    print(f"  - {goals_viz}")
    print(f"  - {combinations_viz}")
    print(f"  - {overview_viz}")
    print(f"  - {stats_path}")

    return stats


if __name__ == "__main__":
    main()
