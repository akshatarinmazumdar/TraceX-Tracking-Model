% TraceX Model Performance Evaluation Chart
% This script generates a graphical chart showing the accuracy of the TraceX 
% Face Recognition and Tracking model in various real-world situations.

% 1. Define different situations (scenarios)
situations = {'Normal Lighting', 'Low Light', 'Motion Blur', 'Partial Occlusion', 'Long Distance', 'Crowded Scene'};
num_situations = length(situations);

% 2. Define accuracy percentages for each situation
% (In values ko aap apne actual model test results ke hisaab se change kar sakte hain)
accuracy = [98.5, 82.3, 85.1, 78.4, 75.2, 88.7];

% 3. Create a new figure with specific size for good visibility
figure('Name', 'TraceX Model Accuracy', 'Position', [100, 100, 900, 500], 'Color', 'w');

% 4. Plot a bar chart
b = bar(accuracy, 'FaceColor', 'flat', 'EdgeColor', 'none', 'BarWidth', 0.6);

% 5. Define custom colors for each bar to make it visually appealing
% Color scheme indicating performance (Green for high, Orange/Red for lower)
colors = [
    0.1 0.7 0.3;  % Green (Normal Lighting - High accuracy)
    0.9 0.6 0.1;  % Orange (Low Light)
    0.8 0.7 0.2;  % Yellow-Orange (Motion Blur)
    0.8 0.4 0.3;  % Red-ish (Partial Occlusion)
    0.9 0.3 0.2;  % Red (Long Distance)
    0.2 0.6 0.8;  % Blue (Crowded Scene)
];

% Apply colors to the bars
b.CData = colors;

% 6. Add title and labels
title('TraceX Model Accuracy in Different Situations', 'FontSize', 16, 'FontWeight', 'bold', 'Color', [0.2 0.2 0.2]);
ylabel('Accuracy (%)', 'FontSize', 12, 'FontWeight', 'bold');
xlabel('Testing Situations', 'FontSize', 12, 'FontWeight', 'bold');

% 7. Format axes
set(gca, 'XTick', 1:num_situations, 'XTickLabel', situations, 'FontSize', 11);
xtickangle(20); % Rotate text slightly for better readability
ylim([0 110]);  % Leave some space at the top

% 8. Add background grid
grid on;
ax = gca;
ax.GridLineStyle = '--';
ax.GridAlpha = 0.4;
ax.YGrid = 'on';
ax.XGrid = 'off';

% 9. Add percentage text values on top of each bar
for i = 1:num_situations
    text(i, accuracy(i) + 2.5, sprintf('%.1f%%', accuracy(i)), ...
        'HorizontalAlignment', 'center', ...
        'FontSize', 11, 'FontWeight', 'bold', 'Color', [0.2 0.2 0.2]);
end

% 10. Add a box showing the overall average accuracy
avg_accuracy = mean(accuracy);
dim = [.78 .80 .15 .1]; % Position of the box
str = sprintf('Overall Avg: %.1f%%', avg_accuracy);
annotation('textbox', dim, 'String', str, 'FitBoxToText', 'on', ...
    'BackgroundColor', [0.95 0.95 0.95], 'EdgeColor', [0.6 0.6 0.6], ...
    'FontSize', 12, 'FontWeight', 'bold', 'Margin', 8);

disp('Accuracy chart generated successfully! Model ki performance ab graphical format mein visible hai.');
