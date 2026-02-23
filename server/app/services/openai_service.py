import json
import re
import asyncio
from typing import Optional, Literal, cast, Any

import aiohttp
import openai

from ..config import get_settings
from ..schemas import PromptCleanResponse, ImageGenerateResponse


class OpenAIService:
    SEARCH_INTENT_PROMPT = """You are an intelligent map search assistant. Parse user queries to understand their intent.
Users may have typos, misspellings, or use informal language. Always correct and interpret their intent.

Analyze the query and extract:
1. **action**: One of:
   - "navigate" - User wants to go to a specific location, landmark, or a building you can identify by name using your world knowledge (e.g., "take me to Paris", "6th tallest building in the world", "teh eifel tower")
   - "find_building" - User wants to find a building by characteristics in the CURRENT VIEW only (e.g., "tallest building here", "biggest footprint nearby")
   - "search_area" - User wants to explore the current area (e.g., "what buildings are here")
   - "set_weather" - User wants to change weather (e.g., "make it rain", "snow", "clear weather")
   - "set_time" - User wants to change time of day (e.g., "night mode", "make it dark", "daytime")
   - "camera_control" - User wants to adjust camera (e.g., "zoom in", "bird's eye", "rotate")
   - "delete_building" - User wants to remove a building (e.g., "delete the CN Tower")
   - "question" - User is asking a question about a place (e.g., "how tall is the Burj Khalifa?")

CRITICAL RULES:
- USE YOUR WORLD KNOWLEDGE. If a user asks for "the Nth tallest building in the world", "the oldest cathedral in Europe", or any factual query, look up the answer from your knowledge and use "navigate" with the specific building/landmark name.
- ALWAYS correct typos and misspellings. "tke me to Prais" means "take me to Paris". "eifel twoer" means "Eiffel Tower".
- If the query references a specific named place, famous building, or identifiable landmark, ALWAYS use "navigate" with the resolved name.
- Only use "find_building" when the user explicitly wants to search the CURRENT viewport (e.g., "tallest here", "biggest around me").
- For VAGUE or ABSTRACT queries like "take me somewhere with good sunrises", "a beautiful beach", "somewhere cold", "a romantic city" — you MUST still resolve this to a REAL, SPECIFIC location using your world knowledge. Pick the best real-world match. NEVER return null for location_query on a navigate action. Examples: "good sunrises" -> "Santorini, Greece", "beautiful beach" -> "Whitehaven Beach, Australia", "somewhere cold" -> "Tromsø, Norway".
- location_query must NEVER be null when action is "navigate". Always resolve to a real place.

2. **location_query**: The corrected, resolved location name.
   - For rankings/facts, resolve to the actual name: "6th tallest building" -> "Goldin Finance 117, Tianjin"
   - For typos, correct them: "empyre state bilding" -> "Empire State Building, New York"
   - For landmarks, include city: "CN Tower, Toronto", "Burj Khalifa, Dubai"
   - If relative ("near here", "in this area"), set to null

3. **building_attributes**: For find_building searches only:
   - sort_by: "height", "area", "underdeveloped", or null
   - building_type: "commercial", "residential", "any" (default: "any")
   - limit: number of results (default: 5)

4. **search_radius_km**: If proximity search mentioned ("within 2km", "nearby" = 1km)

5. **weather_settings**: For set_weather: {"type": "rain|snow|clear"}
6. **time_settings**: For set_time: {"preset": "day|night"}
7. **camera_settings**: For camera_control: {"zoom_delta": number, "pitch": number, "bearing_delta": number}
8. **question_context**: For questions: {"target_name": "building name if mentioned"}

Respond in JSON format:
{
    "action": "navigate|find_building|search_area|set_weather|set_time|camera_control|delete_building|question",
    "location_query": "string or null",
    "building_attributes": {"sort_by": "height|area|underdeveloped|null", "building_type": "any", "limit": 5},
    "search_radius_km": number or null,
    "reasoning": "Brief explanation"
}

Examples:
- "take me to the Eiffel Tower" -> {"action": "navigate", "location_query": "Eiffel Tower, Paris", ...}
- "tke me to prais" -> {"action": "navigate", "location_query": "Paris, France", "reasoning": "Corrected typos: 'tke' -> 'take', 'prais' -> 'Paris'"}
- "6th tallest building in the world" -> {"action": "navigate", "location_query": "Goldin Finance 117, Tianjin, China", "reasoning": "Goldin Finance 117 (530m) is the 6th tallest building in the world"}
- "oldest cathedral in europe" -> {"action": "navigate", "location_query": "Cathedral of Trier, Germany", "reasoning": "The Cathedral of Trier is considered the oldest cathedral in Europe"}
- "tallest building in Toronto" -> {"action": "navigate", "location_query": "CN Tower, Toronto", ...}
- "tallest building here" -> {"action": "find_building", "location_query": null, "building_attributes": {"sort_by": "height", ...}, "reasoning": "Find tallest in current view"}
- "make it rain" -> {"action": "set_weather", "weather_settings": {"type": "rain"}, ...}
- "night mode" -> {"action": "set_time", "time_settings": {"preset": "night"}, ...}
- "zoom in" -> {"action": "camera_control", "camera_settings": {"zoom_delta": 2}, ...}
- "delete the cn tower" -> {"action": "delete_building", "location_query": "CN Tower, Toronto", ...}
- "how tall is big ben" -> {"action": "question", "question_context": {"target_name": "Big Ben, London"}, ...}
- "take me somewhere with good sunrises" -> {"action": "navigate", "location_query": "Santorini, Greece", "reasoning": "Santorini is world-famous for its sunrises and sunsets"}
- "a beautiful old city" -> {"action": "navigate", "location_query": "Prague, Czech Republic", "reasoning": "Prague is renowned for its beautiful old-world architecture"}"""

    ANSWER_GENERATION_PROMPT = """You are a helpful map assistant. Generate a brief, informative response about the search result.

Be concise (1-2 sentences max). Include key facts when available:
- Building name if known
- Height or size if relevant to the query
- Location context

If no results were found, provide a helpful message."""

    STYLE_CONTEXTS = {
        "architectural": "professional architectural visualization, realistic materials and lighting",
        "modern": "modern minimalist architecture, clean lines, glass and steel, realistic rendering",
        "classical": "classical architecture with ornate details, stone and marble textures, realistic rendering",
        "futuristic": "futuristic architecture, sleek materials, dramatic lighting, realistic rendering",
    }

    SYSTEM_PROMPT = """You create prompts for DALL-E that generate images optimized for AI 3D model reconstruction.

YOUR #1 RULE: DO NOT change what the user asked for. If they say "garden", generate a garden — NOT a "garden pavilion". Keep the EXACT subject.

LANDMARK RECOGNITION - THIS IS CRITICAL:
When the user asks for a KNOWN LANDMARK, FAMOUS BUILDING, or REAL-WORLD STRUCTURE (e.g., "CN Tower", "Eiffel Tower", "Sydney Opera House", "Taj Mahal", "Empire State Building"):
1. You MUST identify it as a known structure
2. You MUST include SPECIFIC VISUAL DETAILS from your knowledge:
   - Exact architectural features (e.g., CN Tower's distinctive concrete shaft with observation pod and antenna spire)
   - Real colors and materials (e.g., CN Tower's gray concrete, white observation deck)
   - Distinctive proportions and silhouette
   - Key identifying elements that make it recognizable
3. Set "is_landmark" to true in your response
4. Include the landmark's actual visual description in dalle_prompt

CRITICAL FOR 3D RECONSTRUCTION:
- ISOMETRIC or 3/4 PERSPECTIVE VIEW showing at least 2-3 faces of the subject
- CLEAN WHITE BACKGROUND — absolutely NO environment, ground, sky, or shadows on background
- Subject CENTERED and ISOLATED — the ONLY object in frame
- FLOATING IN EMPTY WHITE SPACE — the subject hovers with nothing below it, the bottom edge of the structure IS the bottom edge of the image, cropped flush at ground level
- SOFT EVEN STUDIO LIGHTING from multiple angles — minimal harsh shadows
- REALISTIC MATERIALS with accurate colors (brick=red/brown, glass=blue-gray, concrete=gray, wood=brown)
- For KNOWN landmarks, match their REAL colors and proportions exactly
- NO text, labels, watermarks, or decorative elements
- Subject should fill ~70% of the frame
- Show the COMPLETE object — no cropping

The image feeds an AI that extracts 3D geometry from shading and edges, so:
- Clear tonal separation between surfaces is essential
- Every visible face needs distinct texture/color
- Avoid extreme perspective distortion

Also generate a SHORT NAME (2-4 words max) that captures the essence of what the user wants.
Examples: "japanese garden" -> "Japanese Garden", "modern glass skyscraper with steel frame" -> "Glass Skyscraper", "victorian mansion with turrets" -> "Victorian Mansion"

Respond in JSON:
{
    "cleaned_prompt": "The user's description preserved faithfully",
    "dalle_prompt": "Optimized prompt for 3D reconstruction",
    "short_name": "2-4 word name",
    "style_tags": ["isometric", "3d-optimized", "white-background"],
    "is_landmark": true/false,
    "landmark_details": "If is_landmark=true, include specific visual details here"
}"""

    SYSTEM_PROMPT_3D_PREVIEW = """You are an expert at creating prompts for 3D architectural visualization renders.
Your job is to take a user's description and create a prompt for a beautiful 3D PERSPECTIVE RENDER of the building.

CRITICAL RULES for the 3D preview prompt:
- Generate a BEAUTIFUL 3D PERSPECTIVE RENDER - like a professional architectural visualization
- Show the building from a dramatic 3/4 angle view
- Use REALISTIC MATERIALS and COLORS - real building materials like glass, steel, brick, concrete
- Include SOFT NATURAL LIGHTING - golden hour or soft daylight
- Add SUBTLE SHADOWS for depth and realism
- Show the building in a MINIMAL CONTEXT - simple ground plane, maybe subtle sky gradient
- Make it look PHOTOREALISTIC and PROFESSIONAL
- This is for USER PREVIEW ONLY - to help them visualize the final 3D model

Example format: "Professional 3D architectural render of a [building],
dramatic 3/4 perspective view, photorealistic materials, soft golden hour lighting,
subtle shadows, minimal environment, architectural visualization quality"

Respond in JSON format:
{
    "preview_prompt": "3D perspective render prompt following the rules above"
}"""

    def __init__(self):
        settings = get_settings()
        if not settings.openai_api_key:
            self._client = None
        else:
            self._client = openai.AsyncOpenAI(api_key=settings.openai_api_key)

    @property
    def is_configured(self) -> bool:
        return self._client is not None

    async def clean_prompt(
        self,
        prompt: str,
        style: str = "architectural"
    ) -> PromptCleanResponse:
        if not self._client:
            raise RuntimeError("OpenAI not configured. Set OPENAI_API_KEY.")

        style_context = self.STYLE_CONTEXTS.get(style, self.STYLE_CONTEXTS["architectural"])

        response = await self._client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": f"Style preference: {style_context}\n\nUser prompt: {prompt}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=500
        )

        content = response.choices[0].message.content
        if content is None:
            raise RuntimeError("No content in OpenAI response")
        result = json.loads(content)

        return PromptCleanResponse(
            original_prompt=prompt,
            cleaned_prompt=result.get("cleaned_prompt", prompt),
            dalle_prompt=result.get("dalle_prompt", prompt),
            short_name=result.get("short_name", prompt[:30]),
            style_tags=result.get("style_tags", [])
        )

    async def generate_images(
        self,
        prompt: str,
        num_images: int = 1,
        size: str = "1024x1024",
        quality: str = "hd",
        style: str = "vivid",
        include_3d_preview: bool = True
    ) -> ImageGenerateResponse:
        _ = num_images
        if not self._client:
            raise RuntimeError("OpenAI not configured. Set OPENAI_API_KEY.")

        enhanced_prompt = await self._enhance_prompt_for_landmarks(prompt)

        render_prompt = (
            f"Isometric 3/4 view from slightly above of {enhanced_prompt}, "
            "showing front and side faces clearly, "
            "COMPLETE building visible from roof to ground floor foundation, "
            "building floats in pure white void with nothing underneath, "
            "absolutely NO platform NO pedestal NO base NO ground NO floor beneath it, "
            "pure white background on all sides including below the building, "
            "bright even studio lighting from all angles eliminating shadows, "
            "photorealistic materials with accurate vibrant colors, "
            "extremely high detail and sharp clean edges, "
            "centered composition filling 70% of frame, "
            "the building is the ONLY object in the image, "
            "professional product photography on seamless white"
        )

        size_param = cast(Literal["1024x1024", "1792x1024", "1024x1792"], size)
        quality_param = cast(Literal["standard", "hd"], quality)
        style_param = cast(Literal["natural", "vivid"], style)

        if include_3d_preview:
            main_task = self._client.images.generate(
                model="dall-e-3",
                prompt=render_prompt,
                size=size_param,
                quality=quality_param,
                style=style_param,
                n=1
            )
            preview_task = self._generate_3d_preview(prompt, size, quality)
            main_response, preview_3d_url = await asyncio.gather(main_task, preview_task)
            image_url = main_response.data[0].url
        else:
            response = await self._client.images.generate(
                model="dall-e-3",
                prompt=render_prompt,
                size=size_param,
                quality=quality_param,
                style=style_param,
                n=1
            )
            image_url = response.data[0].url
            preview_3d_url = None

        return ImageGenerateResponse(
            images=[image_url] if image_url else [],
            prompt_used=prompt,
            preview_3d_url=preview_3d_url
        )

    async def _search_reference_images(self, query: str, max_images: int = 3) -> list[str]:
        try:
            search_query = f"{query} building exterior architecture photo"
            async with aiohttp.ClientSession() as session:
                async with session.get("https://duckduckgo.com/", params={"q": search_query}) as resp:
                    text = await resp.text()
                    vqd_match = re.search(r'vqd=["\']([^"\']+)["\']', text)
                    if not vqd_match:
                        vqd_match = re.search(r'vqd=([^&"\']+)', text)
                    if not vqd_match:
                        return []
                    vqd = vqd_match.group(1)

                params = {
                    "l": "us-en",
                    "o": "json",
                    "q": search_query,
                    "vqd": vqd,
                    "f": ",,,,,",
                    "p": "1",
                }
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
                async with session.get("https://duckduckgo.com/i.js", params=params, headers=headers) as resp:
                    if resp.status != 200:
                        return []
                    data = await resp.json()
                    results = data.get("results", [])
                    return [r.get("image") for r in results[:max_images] if r.get("image")]
        except Exception:
            return []

    async def _analyze_reference_images(self, prompt: str, image_urls: list[str]) -> str:
        if not self._client or not image_urls:
            return prompt

        try:
            content: list[Any] = [
                {
                    "type": "text",
                    "text": f"""Analyze these reference images of "{prompt}" and provide a DETAILED architectural description.

Focus on:
1. EXACT shape and form - is it rectangular, cylindrical, has wings, towers, unique geometry?
2. Materials and colors - concrete, glass, brick, steel? What colors exactly?
3. Distinctive features - any unique architectural elements, patterns, windows, facades?
4. Proportions - height vs width, number of floors visible, any setbacks?
5. Style - brutalist, modern, classical, etc?

Be VERY SPECIFIC. This description will be used to generate an accurate 3D model.
If images show different buildings or aren't helpful, describe what you can see.

Respond with ONLY the detailed description, no JSON or formatting."""
                }
            ]

            for url in image_urls[:3]:
                content.append({
                    "type": "image_url",
                    "image_url": {"url": url, "detail": "high"}
                })

            response = await self._client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": content}],  # type: ignore[arg-type]
                max_tokens=500
            )

            result = response.choices[0].message.content
            if result:
                return result.strip()
            return prompt

        except Exception:
            return prompt

    async def _enhance_prompt_for_landmarks(self, prompt: str) -> str:
        if not self._client:
            return prompt

        try:
            check_response = await self._client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": """Determine if this is a request for a SPECIFIC REAL-WORLD building or landmark.
Return JSON: {"is_real_building": true/false, "search_query": "optimized search query if true, else null"}

Examples:
- "CN Tower" -> {"is_real_building": true, "search_query": "CN Tower Toronto"}
- "MC Building Waterloo" -> {"is_real_building": true, "search_query": "MC Building University of Waterloo"}
- "Empire State Building" -> {"is_real_building": true, "search_query": "Empire State Building New York"}
- "modern glass skyscraper" -> {"is_real_building": false, "search_query": null}
- "a cozy cottage" -> {"is_real_building": false, "search_query": null}"""},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=100
            )

            check_content = check_response.choices[0].message.content
            if not check_content:
                return prompt
            check_result = json.loads(check_content)

            if check_result.get("is_real_building"):
                search_query = check_result.get("search_query", prompt)
                image_urls = await self._search_reference_images(search_query)
                if image_urls:
                    enhanced = await self._analyze_reference_images(prompt, image_urls)
                    return enhanced

            response = await self._client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": """You are an expert at identifying famous landmarks and buildings.
If this is a KNOWN landmark, provide a detailed visual description from your knowledge.
If it's generic, return the original prompt unchanged.

Respond in JSON:
{
    "is_landmark": true/false,
    "enhanced_description": "detailed visual description or original prompt"
}"""},
                    {"role": "user", "content": f"Describe: {prompt}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=400
            )

            content = response.choices[0].message.content
            if content is None:
                return prompt
            result = json.loads(content)

            if result.get("is_landmark", False):
                return result.get("enhanced_description", prompt)
            return prompt

        except Exception:
            return prompt

    async def _generate_3d_preview(
        self,
        prompt: str,
        size: str = "1024x1024",
        quality: str = "hd"
    ) -> Optional[str]:
        if not self._client:
            raise RuntimeError("OpenAI not configured. Set OPENAI_API_KEY.")

        try:
            gpt_response = await self._client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": self.SYSTEM_PROMPT_3D_PREVIEW},
                    {"role": "user", "content": f"Create a 3D preview prompt for: {prompt}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.5,
                max_tokens=300
            )

            content = gpt_response.choices[0].message.content
            if content is None:
                raise RuntimeError("No content in OpenAI response")
            result = json.loads(content)
            default_preview = (
                f"Professional 3D architectural render of {prompt}, "
                "dramatic perspective view, photorealistic"
            )
            preview_prompt = result.get("preview_prompt", default_preview)

            size_param = cast(
                Literal["1024x1024", "1792x1024", "1024x1792"],
                size
            )
            quality_param = cast(Literal["standard", "hd"], quality)
            response = await self._client.images.generate(
                model="dall-e-3",
                prompt=preview_prompt,
                size=size_param,
                quality=quality_param,
                style="vivid",
                n=1
            )
            return response.data[0].url
        except Exception:
            return None

    async def parse_search_intent(self, query: str) -> dict:
        if not self._client:
            return self._fallback_intent_parse(query)

        try:
            response = await self._client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": self.SEARCH_INTENT_PROMPT},
                    {"role": "user", "content": f"Parse this search query: {query}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=300
            )

            content = response.choices[0].message.content
            if content is None:
                raise RuntimeError("No content in OpenAI response")
            return json.loads(content)
        except Exception:
            return self._fallback_intent_parse(query)

    def _fallback_intent_parse(self, query: str) -> dict:
        query_lower = query.lower()

        if any(phrase in query_lower for phrase in ["take me to", "go to", "navigate to", "fly to"]):
            for phrase in ["take me to", "go to", "navigate to", "fly to"]:
                if phrase in query_lower:
                    location = query_lower.split(phrase, 1)[1].strip()
                    if any(word in location for word in ["tallest", "biggest", "underdeveloped"]):
                        break
                    return {
                        "action": "navigate",
                        "location_query": location,
                        "building_attributes": None,
                        "search_radius_km": None,
                        "reasoning": "Fallback: navigation phrase detected"
                    }

        sort_by = None
        if any(word in query_lower for word in ["tallest", "tall", "highest", "height"]):
            sort_by = "height"
        elif any(word in query_lower for word in ["biggest", "largest", "footprint", "area"]):
            sort_by = "area"
        elif any(word in query_lower for word in ["underdeveloped", "low-rise", "short building"]):
            sort_by = "underdeveloped"

        if sort_by:
            return {
                "action": "find_building",
                "location_query": None,
                "building_attributes": {"sort_by": sort_by, "building_type": "any", "limit": 5},
                "search_radius_km": None,
                "reasoning": f"Fallback: building search for {sort_by}"
            }

        return {
            "action": "search_area",
            "location_query": None,
            "building_attributes": None,
            "search_radius_km": None,
            "reasoning": "Fallback: no specific intent detected"
        }

    async def generate_search_answer(
        self,
        query: str,
        top_result: Optional[dict],
        location_name: Optional[str],
        intent: Optional[dict] = None
    ) -> str:
        if not self._client:
            return self._fallback_answer_generation(query, top_result, location_name, intent)

        try:
            if not top_result:
                context = f"Query: {query}\nLocation: {location_name or 'current viewport'}\nResult: No buildings found."
            else:
                props = top_result.get("properties", {})
                context = f"""Query: {query}
Location: {location_name or 'current viewport'}
Top result properties: {json.dumps(props, indent=2)}
Intent: {json.dumps(intent) if intent else 'unknown'}"""

            response = await self._client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": self.ANSWER_GENERATION_PROMPT},
                    {"role": "user", "content": context}
                ],
                temperature=0.7,
                max_tokens=100
            )

            content = response.choices[0].message.content
            return content if content is not None else ""
        except Exception:
            return self._fallback_answer_generation(query, top_result, location_name, intent)

    def _fallback_answer_generation(
        self,
        _: str,
        top_result: Optional[dict],
        location_name: Optional[str],
        intent: Optional[dict]
    ) -> str:
        if not top_result:
            return f"No buildings found{' near ' + location_name if location_name else ' in this area'}."

        props = top_result.get("properties", {})
        name = props.get("name") or props.get("addr:housename") or props.get("addr:housenumber") or "this building"

        sort_by = intent.get("building_attributes", {}).get("sort_by") if intent else None

        if sort_by == "height":
            height = props.get("height", props.get("building:levels", "unknown"))
            return f"The tallest building is {name} ({height})."
        elif sort_by == "area":
            return f"The building with the largest footprint is {name}."
        elif sort_by == "underdeveloped":
            return f"The most underdeveloped building (large footprint, low height) is {name}."
        else:
            return f"Found {name} matching your query."
