from openai import OpenAI
from config.config import API_KEY
import json
from datetime import datetime
from main import create_event

client = OpenAI(api_key=API_KEY)

tool_parameters = {
    "type": "object",
    "properties": {
        "title": {
            "type": "string",
            "description": "The title of the calendar event"
        },
        "date": {
            "type": "string",
            "description": "The starting date of the event in 'YYYY-MM-DD' format"
        },
        "start_time": {
            "type": "string",
            "description": "The start time of the event in 'HH:MM' format"
        },
        "end_time": {
            "type": "string",
            "description": "The end time of the event in 'HH:MM' format"
        },
        "recurrence": {
            "type": "string",
            "description": "Recurrence rule in RRULE format (e.g., 'RRULE:FREQ=WEEKLY;BYDAY=Mon') if the event repeats"
        },
        "reminder": {
            "type": "integer",
            "description": "Reminder time in minutes before the event start"
        }
    },
    "required": ["title", "date", "start_time", "end_time"],
    "additionalProperties": False
}

def run_conversation(content, callback=None):
    """
    Process user input through OpenAI API to extract event parameters.
    
    Args:
        content: User input string
        callback: Optional callback function to handle parsed events
        
    Returns:
        Response text if no callback is provided, or None if callback is used
    """
    today_str = datetime.now().strftime("%Y-%m-%d")
    conversation_prompt = f"Today's date is {today_str}. " + content

    messages = [{"role": "user", "content": conversation_prompt}]
    tools = [
        {
        "type": "function",
        "function": {
            "name": "create_calendar_event",
            "description": "Create a calendar event based on the given parameters (like title, date, start time, end time, recurrence, and reminder)",
            "parameters": tool_parameters,
        },
    }]
    
    response = client.chat.completions.create(
        model="gpt-4.1-nano",
        messages=messages,
        tools=tools,
        tool_choice="auto"
    )
    response_message = response.choices[0].message
    tool_calls = response_message.tool_calls

    if tool_calls:
        events = []
        for tool_call in tool_calls:
            try:
                event_params = json.loads(tool_call.function.arguments)
                events.append(event_params)
            except json.JSONDecodeError:
                return "Error parsing event parameters."
        
        if not events:
            return "No valid event details were parsed."
        
        # Build a confirmation message that lists each event's details.
        confirmation_text = "I parsed the following events:\n"
        for i, event in enumerate(events):
            confirmation_text += (
                f"Event {i+1}: Title: {event.get('title', 'N/A')}, "
                f"Date: {event.get('date', 'N/A')}, "
                f"Start Time: {event.get('start_time', 'N/A')}, "
                f"End Time: {event.get('end_time', 'N/A')}"
            )
            if "recurrence" in event:
                confirmation_text += f", Recurrence: {event.get('recurrence')}"
            if "reminder" in event:
                confirmation_text += f", Reminder: {event.get('reminder')} minutes before"
            confirmation_text += "\n"
        confirmation_text += "Do you want to create these events? (yes/no)"
        
        if callback:
            # Pass the events and confirmation text to the callback function
            callback(events, confirmation_text)
            return None
        else:
            return confirmation_text
    else:
        return "No event details were parsed from your message. Please provide more specific details about the event."