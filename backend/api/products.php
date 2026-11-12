<?php
declare(strict_types=1);

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';

$method = request_method();
$pdo = db();

const PRODUCT_COLUMNS = [
    'nombre', 'categoria', 'es_caja', 'presentacion', 'descripcion', 'ficha_tecnica', 'precio',
    'imagenes', 'variantes', 'descuento_porcentaje', 'tipo_promocion', 'descuento_segunda_unidad',
    'etiqueta', 'activo',
];

function find_product(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM productos WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? decode_product($row) : null;
}

function product_id_param(): int
{
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if (!$id) {
        json_error('Falta un id de producto válido.', 400);
    }
    return $id;
}

switch ($method) {
    case 'GET':
        // Público: solo activos. Con ?all=1 y sesión de admin: todos.
        $all = isset($_GET['all']) && current_admin() !== null;
        if (isset($_GET['id'])) {
            $product = find_product($pdo, product_id_param());
            if (!$product || (!$product['activo'] && !$all)) {
                json_error('Producto no encontrado.', 404);
            }
            json_response($product);
        }
        $sql = 'SELECT * FROM productos' . ($all ? '' : ' WHERE activo = 1') . ' ORDER BY categoria = \'cajas\', id ASC';
        $rows = $pdo->query($sql)->fetchAll();
        json_response(array_map('decode_product', $rows));
        break;

    case 'POST':
        require_admin();
        [$data, $errors] = sanitize_product(read_json_body());
        if ($errors) {
            json_error('Datos inválidos.', 422, $errors);
        }
        $cols = implode(', ', PRODUCT_COLUMNS);
        $marks = implode(', ', array_map(static fn ($c) => ':' . $c, PRODUCT_COLUMNS));
        $stmt = $pdo->prepare("INSERT INTO productos ($cols) VALUES ($marks)");
        $stmt->execute(array_intersect_key($data, array_flip(PRODUCT_COLUMNS)));
        json_response(find_product($pdo, (int) $pdo->lastInsertId()), 201);
        break;

    case 'PUT':
        require_admin();
        $id = product_id_param();
        if (!find_product($pdo, $id)) {
            json_error('Producto no encontrado.', 404);
        }
        [$data, $errors] = sanitize_product(read_json_body());
        if ($errors) {
            json_error('Datos inválidos.', 422, $errors);
        }
        $set = implode(', ', array_map(static fn ($c) => "$c = :$c", PRODUCT_COLUMNS));
        $stmt = $pdo->prepare("UPDATE productos SET $set WHERE id = :id");
        $params = array_intersect_key($data, array_flip(PRODUCT_COLUMNS));
        $params['id'] = $id;
        $stmt->execute($params);
        json_response(find_product($pdo, $id));
        break;

    case 'DELETE':
        require_admin();
        $id = product_id_param();
        $stmt = $pdo->prepare('DELETE FROM productos WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) {
            json_error('Producto no encontrado.', 404);
        }
        json_response(['id' => $id, 'deleted' => true]);
        break;

    default:
        header('Allow: GET, POST, PUT, DELETE, OPTIONS');
        json_error('Método no permitido.', 405);
}
