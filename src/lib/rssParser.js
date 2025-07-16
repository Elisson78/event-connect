// Parser RSS para eventos externos
export const parseRSSFeed = (rssText) => {
  try {
    // Criar um parser DOM para processar o XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rssText, "text/xml");
    
    // Verificar se há erros de parsing
    const parseError = xmlDoc.getElementsByTagName("parsererror");
    if (parseError.length > 0) {
      throw new Error("Erro ao processar RSS feed");
    }

    // Extrair informações do canal
    const channel = xmlDoc.querySelector("channel");
    const channelTitle = channel?.querySelector("title")?.textContent || "Eventos Externos";
    const channelLink = channel?.querySelector("link")?.textContent || "";
    const channelDescription = channel?.querySelector("description")?.textContent || "";

    // Extrair todos os itens
    const items = xmlDoc.querySelectorAll("item");
    const events = [];

    items.forEach((item, index) => {
      try {
        const title = item.querySelector("title")?.textContent || "";
        const link = item.querySelector("link")?.textContent || "";
        const description = item.querySelector("description")?.textContent || "";
        const pubDate = item.querySelector("pubDate")?.textContent || "";
        const creator = item.querySelector("dc\\:creator")?.textContent || 
                       item.querySelector("creator")?.textContent || "";
        const guid = item.querySelector("guid")?.textContent || "";

        // Extrair imagem da descrição (se houver)
        const imgMatch = description.match(/src="([^"]+)"/);
        const image = imgMatch ? imgMatch[1] : null;

        // Limpar descrição de tags HTML
        const cleanDescription = description
          .replace(/<[^>]*>/g, '') // Remove tags HTML
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .trim();

        // Extrair localização da descrição (se houver)
        const locationMatch = description.match(/Lieu[^<]*<[^>]*>([^<]+)</);
        const location = locationMatch ? locationMatch[1].trim() : "";

        // Determinar categoria baseada no título ou descrição
        const category = determineCategory(title, cleanDescription);

        events.push({
          id: index + 1,
          title,
          description: cleanDescription,
          date: pubDate,
          location,
          link,
          image,
          category,
          source: creator || channelTitle,
          guid
        });
      } catch (itemError) {
        console.error("Erro ao processar item RSS:", itemError);
      }
    });

    return {
      channel: {
        title: channelTitle,
        link: channelLink,
        description: channelDescription
      },
      events
    };
  } catch (error) {
    console.error("Erro ao processar RSS feed:", error);
    throw error;
  }
};

// Função para determinar categoria baseada no conteúdo
const determineCategory = (title, description) => {
  const text = (title + " " + description).toLowerCase();
  
  if (text.includes("formation") || text.includes("atelier") || text.includes("workshop")) {
    return "Formação";
  }
  if (text.includes("exposition") || text.includes("expo")) {
    return "Exposição";
  }
  if (text.includes("concert") || text.includes("musique") || text.includes("musical")) {
    return "Música";
  }
  if (text.includes("conférence") || text.includes("séminaire")) {
    return "Conferência";
  }
  if (text.includes("vente") || text.includes("enchère")) {
    return "Venda";
  }
  if (text.includes("eau") || text.includes("environnement") || text.includes("écologie")) {
    return "Meio Ambiente";
  }
  if (text.includes("sport") || text.includes("activité")) {
    return "Esporte";
  }
  if (text.includes("culture") || text.includes("art")) {
    return "Cultura";
  }
  
  return "Evento";
};

// Função para buscar RSS feed de uma URL
export const fetchRSSFeed = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const rssText = await response.text();
    return parseRSSFeed(rssText);
  } catch (error) {
    console.error("Erro ao buscar RSS feed:", error);
    throw error;
  }
}; 