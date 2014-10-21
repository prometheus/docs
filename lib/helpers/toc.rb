def nav_title_of(i)
  i[:nav_title] || i[:title] || ''
end

def decorate_title_for(i, title)
  return i[:nav_icon] unless i[:nav_icon].nil?
  if !i.children.empty?
    if @item_rep.path.start_with?(i.path)
      "chevron-down"
    else
      "chevron-right"
    end
  end
end

def toc(root_item, focused_item, buffer='', with_children=true)
  # Skip non-written or hidden items
  return buffer if root_item.nil? || root_item.path.nil? || root_item[:is_hidden]

  # Open list element
  is_active = @item_rep && @item_rep.path == root_item.path
  if is_active
    buffer << "<li class=\"active\">"
  else
    buffer << "<li>"
  end

  # Add link
  title = nav_title_of(root_item)
  if root_item[:nav_icon]
    title = "<i class=\"fa fa-fw fa-#{root_item[:nav_icon]}\"></i> " + title
  end
  if !root_item.children.empty?
    icon = if @item_rep.path.start_with?(root_item.path)
    else
      "chevron-down"
    end
    title = title + " <i class=\"pull-right fa fa-fw fa-#{icon}\"></i>"
  end
  buffer << link_to(title, root_item.path)

  # Add children to sitemap, recursively
  visible_children = root_item.children.select { |child| !child[:is_hidden] && child.path }
  visible_children = visible_children.sort_by { |child| child[:sort_rank] || 0 }
  visible_children = visible_children.select do |child|
    focused_item.identifier.start_with?(child.identifier) ||
    focused_item.identifier.start_with?(child.parent.identifier)
  end
  if with_children && visible_children.size > 0
    buffer << '<ul class="nav">'

    visible_children.each do |child|
      toc(child, focused_item, buffer)
    end

    buffer << '</ul>'
  end

  # Close list element
  buffer << '</li>'

  # Return sitemap
  buffer
end
