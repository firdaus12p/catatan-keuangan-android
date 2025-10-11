import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";
import { Card } from "react-native-paper";

const screenWidth = Dimensions.get("window").width;

interface ChartCardProps {
  title: string;
  type: "bar" | "pie";
  data: any;
  style?: any;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  type,
  data,
  style,
}) => {
  const chartConfig = {
    backgroundColor: "#FFFFFF",
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#FFFFFF",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#2196F3",
    },
    propsForLabels: {
      fontSize: 12,
    },
  };

  const renderBarChart = () => (
    <BarChart
      data={data}
      width={screenWidth - 64}
      height={220}
      chartConfig={chartConfig}
      verticalLabelRotation={30}
      style={styles.chart}
      fromZero={true}
      showValuesOnTopOfBars={true}
      yAxisLabel=""
      yAxisSuffix=""
    />
  );

  const renderPieChart = () => (
    <PieChart
      data={data}
      width={screenWidth - 64}
      height={220}
      chartConfig={chartConfig}
      accessor="population"
      backgroundColor="transparent"
      paddingLeft="15"
      center={[10, 50]}
      absolute
      style={styles.chart}
    />
  );

  return (
    <Card style={[styles.card, style]} elevation={2}>
      <Card.Content>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.chartContainer}>
          {type === "bar" ? renderBarChart() : renderPieChart()}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 16,
    textAlign: "center",
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
