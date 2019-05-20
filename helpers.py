def split_list(sequence, splitter):    
  group = []    
  for item in sequence:
    if item != splitter:
      group.append(item)
    elif group:
      yield group
      group = []
  if group:
  	yield group
