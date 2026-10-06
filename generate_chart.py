import matplotlib.pyplot as plt
import numpy as np

# 1. Define different situations (scenarios)
situations = ['Normal Lighting', 'Low Light', 'Motion Blur', 'Partial Occlusion', 'Long Distance', 'Crowded Scene']
num_situations = len(situations)

# 2. Define accuracy percentages for each situation
accuracy = [98.5, 82.3, 85.1, 78.4, 75.2, 88.7]

# 3. Create a new figure
plt.figure(figsize=(10, 6), facecolor='white')

# 4. Define custom colors for each bar
colors = [
    (0.1, 0.7, 0.3),  # Green
    (0.9, 0.6, 0.1),  # Orange
    (0.8, 0.7, 0.2),  # Yellow-Orange
    (0.8, 0.4, 0.3),  # Red-ish
    (0.9, 0.3, 0.2),  # Red
    (0.2, 0.6, 0.8),  # Blue
]

# 5. Plot a bar chart
bars = plt.bar(situations, accuracy, color=colors, width=0.6)

# 6. Add title and labels
plt.title('TraceX Model Accuracy in Different Situations', fontsize=16, fontweight='bold', color='#333333', pad=20)
plt.ylabel('Accuracy (%)', fontsize=12, fontweight='bold')
plt.xlabel('Testing Situations', fontsize=12, fontweight='bold')

# 7. Format axes
plt.xticks(rotation=20, fontsize=11)
plt.ylim(0, 110)

# 8. Add background grid
plt.grid(axis='y', linestyle='--', alpha=0.4)

# 9. Add percentage text values on top of each bar
for bar in bars:
    yval = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2, yval + 2, f'{yval:.1f}%', 
             ha='center', va='bottom', fontsize=11, fontweight='bold', color='#333333')

# 10. Add a box showing the overall average accuracy
avg_accuracy = np.mean(accuracy)
bbox_props = dict(boxstyle="round,pad=0.5", fc="#F2F2F2", ec="#999999", lw=1)
plt.text(0.95, 0.95, f'Overall Avg: {avg_accuracy:.1f}%', 
         transform=plt.gca().transAxes, fontsize=12, fontweight='bold', 
         verticalalignment='top', horizontalalignment='right', bbox=bbox_props)

plt.tight_layout()

# Save the plot
plt.savefig('/run/media/akshat/New Volume/My Stuff/My Projects/Trace-X/accuracy_chart.png', dpi=300)
print('Chart saved successfully.')
