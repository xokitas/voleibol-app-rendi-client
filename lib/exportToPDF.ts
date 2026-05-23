// lib/exportToPDF.ts
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export const exportToPDF = async (html: string, fileName: string) => {
  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: fileName,
      });
    } else {
      // Si no se puede compartir, al menos lo abrimos
      await Print.printAsync({ uri });
    }
  } catch (error) {
    console.error("Error al exportar PDF:", error);
  }
};
