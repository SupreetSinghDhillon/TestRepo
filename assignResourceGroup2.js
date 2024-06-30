const fetch = require("node-fetch"); // Assuming Node.js environment

// Function to interact with OpenAI's API
async function categorizeSiteUsingOpenAI(url, categories) {
  // Construct the prompt
  let prompt = `Given the URL '${url}', categorize the site into one of the following categories based on its likely content: ${Object.keys(
    categories
  ).join(", ")}.`;

  // API call to OpenAI
  const response = await fetch(
    "https://api.openai.com/v1/engines/text-davinci-003/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer YOUR_OPENAI_API_KEY`, // Replace YOUR_OPENAI_API_KEY with your actual API key
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 60,
        temperature: 0.5,
      }),
    }
  );

  const data = await response.json();
  return data.choices[0].text.trim();
}

// Main function to assign resource groups
export async function assignResourceGroups(dataObject, categories) {
  console.log("assignResourceGroups is called with arguments: ", dataObject);

  const categoryData = {};

  // Initialize categoryData array to hold resources based on the categoryName
  for (const categoryName in categories) {
    categoryData[categoryName] = [];
  }

  // Re-organize data into groups or arrays based on categorization rules
  for (let siteInfo of dataObject) {
    console.log("---inside categorization logic loop---");
    let categorized = false;

    // Check if siteInfo has a category property and if it has a value
    if (
      siteInfo.hasOwnProperty("categoryName") &&
      siteInfo.categoryName !== null &&
      siteInfo.categoryName !== undefined
    ) {
      console.log(
        "CASE 1: this siteInfo has a categoryName property",
        siteInfo.categoryName
      );
      if (siteInfo.categoryName === "uncategorized") {
        console.log("...and the category is uncategorized");

        // Dynamically call OpenAI to assign a category based on the URL
        let aiAssignedCategory = await categorizeSiteUsingOpenAI(
          siteInfo.url,
          categories
        );
        siteInfo.categoryName = aiAssignedCategory.toLowerCase();

        if (categories.hasOwnProperty(aiAssignedCategory)) {
          console.log(
            "current site pushed into categoryData array: ",
            aiAssignedCategory
          );
          categoryData[aiAssignedCategory].push(siteInfo);
          categorized = true;
        }
      } else {
        const categoryName = siteInfo.categoryName.toLowerCase();
        if (categories.hasOwnProperty(categoryName)) {
          categorized = true;
          categoryData[categoryName].push(siteInfo);
        }
      }
    } else {
      // If no category is defined, ask OpenAI for help
      let aiAssignedCategory = await categorizeSiteUsingOpenAI(
        siteInfo.url,
        categories
      );
      siteInfo.categoryName = aiAssignedCategory.toLowerCase();

      if (categories.hasOwnProperty(aiAssignedCategory)) {
        console.log(
          "current site pushed into categoryData array: ",
          aiAssignedCategory
        );
        categoryData[aiAssignedCategory].push(siteInfo);
        categorized = true;
      }
    }

    // If the siteInfo has not been categorized, push it to the uncategorized group
    if (!categorized) {
      console.log("CASE 3: categorized flag is still false for: ", siteInfo);
      categoryData["uncategorized"].push(siteInfo);
    }
  }

  return Promise.resolve(categoryData);
}
